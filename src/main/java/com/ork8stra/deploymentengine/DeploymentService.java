package com.ork8stra.deploymentengine;

import com.ork8stra.applicationmanagement.Application;
import com.ork8stra.applicationmanagement.ApplicationService;
import com.ork8stra.applicationmanagement.ServiceConnection;
import com.ork8stra.applicationmanagement.ServiceConnectionService;
import com.ork8stra.buildengine.BuildCompletedEvent;
import com.ork8stra.projectmanagement.Project;
import com.ork8stra.projectmanagement.ProjectService;
import io.fabric8.kubernetes.api.model.EnvVar;
import io.fabric8.kubernetes.api.model.IntOrString;
import io.fabric8.kubernetes.api.model.NamespaceBuilder;
import io.fabric8.kubernetes.api.model.Quantity;
import io.fabric8.kubernetes.api.model.ServiceBuilder;
import io.fabric8.kubernetes.api.model.apps.DeploymentBuilder;
import io.fabric8.kubernetes.api.model.networking.v1.IngressBuilder;
import io.fabric8.kubernetes.api.model.networking.v1.IngressTLSBuilder;
import io.fabric8.kubernetes.client.KubernetesClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeploymentService {

        private final DeploymentRepository deploymentRepository;
        private final KubernetesClient kubernetesClient;
        private final ApplicationService applicationService;
        private final ProjectService projectService;
        private final ServiceConnectionService connectionService;

        @Value("${kubelite.base-domain}")
        private String baseDomain;

        @Value("${kubelite.default-container-port:8080}")
        private int defaultContainerPort;

        public void setBaseDomain(String baseDomain) {
             this.baseDomain = baseDomain;
        }

        @ApplicationModuleListener
        @Transactional(propagation = Propagation.REQUIRES_NEW)
        public void onBuildCompleted(BuildCompletedEvent event) {
                if (!event.success()) {
                        return;
                }

                Application app = applicationService.getApplication(event.applicationId());
                Project project = projectService.getProjectById(app.getProjectId());
                deploy(app, project, event.imageTag());
        }

        public Deployment deploy(Application app, Project project, String imageTag) {
                Deployment deployment = new Deployment(app.getId(), imageTag);
                deploymentRepository.save(deployment);

                String ingressUrl = applyRuntimeResources(app, project, imageTag, 1);
                deployment.setIngressUrl(ingressUrl);
                deployment.setReplicas(1);
                deployment.setStatus(DeploymentStatus.HEALTHY);
                return deploymentRepository.save(deployment);
        }

        @Transactional
        public void reconcileLatestDeployment(Application app, Project project, Deployment deployment) {
                int desiredReplicas = deployment.getReplicas() <= 0 ? 0 : deployment.getReplicas();
                String ingressUrl = applyRuntimeResources(app, project, deployment.getVersion(), desiredReplicas);

                deployment.setIngressUrl(ingressUrl);
                deployment.setStatus(desiredReplicas == 0 ? DeploymentStatus.STOPPED : DeploymentStatus.HEALTHY);
                deploymentRepository.save(deployment);
        }

        public void stopApplication(Application app, Project project) {
                scaleApplication(app, project, 0);
                updateLatestDeploymentStatus(app.getId(), DeploymentStatus.STOPPED, 0);
        }

        public void startApplication(Application app, Project project) {
                scaleApplication(app, project, 1);
                updateLatestDeploymentStatus(app.getId(), DeploymentStatus.HEALTHY, 1);
        }

        public void restartApplication(Application app, Project project) {
                String namespace = project.getK8sNamespace();
                String deploymentName = resolveDeploymentName(app, project);

                if (kubernetesClient.apps().deployments().inNamespace(namespace).withName(deploymentName).get() != null) {
                        kubernetesClient.apps().deployments()
                                        .inNamespace(namespace)
                                        .withName(deploymentName)
                                        .rolling().restart();
                } else {
                        log.warn("Deployment '{}' not found in namespace '{}'. Cannot restart.", deploymentName, namespace);
                }

                updateLatestDeploymentStatus(app.getId(), DeploymentStatus.RESTARTING, 1);
        }

        private String applyRuntimeResources(Application app, Project project, String imageTag, int replicas) {
                String namespace = project.getK8sNamespace();
                String resourceName = toKubernetesName(app.getName());
                String deploymentName = resourceName + "-deploy";
                int containerPort = detectPortFromImage(imageTag, app);
                Map<String, String> envVars = buildRuntimeEnv(app, project, containerPort);

                ensureNamespace(project);

                kubernetesClient.apps().deployments().inNamespace(namespace).resource(
                                new DeploymentBuilder()
                                                .withNewMetadata()
                                                .withName(deploymentName)
                                                .addToLabels("app", resourceName)
                                                .endMetadata()
                                                .withNewSpec()
                                                .withReplicas(replicas)
                                                .withNewSelector()
                                                .addToMatchLabels("app", resourceName)
                                                .endSelector()
                                                .withNewTemplate()
                                                .withNewMetadata()
                                                .addToLabels("app", resourceName)
                                                .addToAnnotations("ork8stra.com/restartedAt", Instant.now().toString())
                                                .endMetadata()
                                                .withNewSpec()
                                                .addNewContainer()
                                                .withName(resourceName)
                                                .withImage(imageTag)
                                                .withNewResources()
                                                        .addToRequests("cpu", new Quantity("100m"))
                                                        .addToRequests("memory", new Quantity("256Mi"))
                                                        .addToLimits("cpu", new Quantity("500m"))
                                                        .addToLimits("memory", new Quantity("512Mi"))
                                                .endResources()
                                                .addNewPort()
                                                .withContainerPort(containerPort)
                                                .endPort()
                                                .withEnv(envVars.entrySet().stream()
                                                                .map(e -> new EnvVar(e.getKey(), e.getValue(), null))
                                                                .toList())
                                                .endContainer()
                                                .endSpec()
                                                .endTemplate()
                                                .endSpec()
                                                .build())
                                .createOrReplace();

                kubernetesClient.services().inNamespace(namespace).resource(
                                new ServiceBuilder()
                                                .withNewMetadata()
                                                .withName(resourceName + "-svc")
                                                .addToLabels("app", resourceName)
                                                .endMetadata()
                                                .withNewSpec()
                                                .withSelector(Collections.singletonMap("app", resourceName))
                                                .addNewPort()
                                                .withName("http")
                                                .withPort(80)
                                                .withTargetPort(new IntOrString(80))
                                                .endPort()
                                                .addNewPort()
                                                .withName("api")
                                                .withPort(3001)
                                                .withTargetPort(new IntOrString(3001))
                                                .endPort()
                                                .withType("ClusterIP")
                                                .endSpec()
                                                .build())
                                .createOrReplace();

                String host = buildIngressHost(project, app);

                IngressBuilder ingressBuilder = new IngressBuilder()
                                .withNewMetadata()
                                .withName(resourceName + "-ingress")
                                .addToLabels("app", resourceName)
                                .addToAnnotations("cert-manager.io/cluster-issuer", "kubelite-selfsigned")
                                .addToAnnotations("nginx.ingress.kubernetes.io/ssl-redirect", "true")
                                .addToAnnotations("nginx.ingress.kubernetes.io/rewrite-target", "/$2")
                                .endMetadata()
                                .withNewSpec()
                                .withTls(new IngressTLSBuilder()
                                                .addToHosts(host)
                                                .withSecretName(resourceName + "-tls-secret")
                                                .build())
                                .addNewRule()
                                .withHost(host)
                                .withNewHttp()
                                .addNewPath()
                                .withPath("/()(.*)")
                                .withPathType("ImplementationSpecific")
                                .withNewBackend()
                                .withNewService()
                                .withName(resourceName + "-svc")
                                .withNewPort()
                                .withNumber(80)
                                .endPort()
                                .endService()
                                .endBackend()
                                .endPath()
                                .addNewPath()
                                .withPath("/api(/|$)(.*)")
                                .withPathType("ImplementationSpecific")
                                .withNewBackend()
                                .withNewService()
                                .withName(resourceName + "-svc")
                                .withNewPort()
                                .withNumber(3001)
                                .endPort()
                                .endService()
                                .endBackend()
                                .endPath()
                                .endHttp()
                                .endRule()
                                .endSpec();

                // Magic Proxying based on ReactFlow Connections
                List<ServiceConnection> connections = connectionService.getOutgoingConnections(app.getId());
                for (ServiceConnection conn : connections) {
                        try {
                                Application target = applicationService.getApplication(conn.getTargetAppId());
                                String targetName = toKubernetesName(target.getName());
                                ingressBuilder.editSpec()
                                        .editFirstRule()
                                        .editHttp()
                                        .addNewPath()
                                                .withPath("/" + targetName + "(/|$)(.*)")
                                                .withPathType("ImplementationSpecific")
                                                .withNewBackend()
                                                        .withNewService()
                                                                .withName(targetName + "-svc")
                                                                .withNewPort()
                                                                        .withNumber(80)
                                                                .endPort()
                                                        .endService()
                                                .endBackend()
                                        .endPath()
                                        .endHttp()
                                        .endRule()
                                        .endSpec();
                        } catch (Exception e) {
                                log.warn("Failed to add magic connection path for target {}: {}", conn.getTargetAppId(), e.getMessage());
                        }
                }

                kubernetesClient.network().v1().ingresses().inNamespace(namespace).resource(ingressBuilder.build()).createOrReplace();

                return "https://" + host;
        }

        private Map<String, String> buildRuntimeEnv(Application app, Project project, int containerPort) {
                Map<String, String> env = new LinkedHashMap<>();
                if (app.getEnvVars() != null) {
                        env.putAll(app.getEnvVars());
                }

                // Automatic Service Discovery for other apps in the same project
                List<Application> otherApps = applicationService.getApplicationsByProject(project.getId());
                for (Application other : otherApps) {
                        if (other.getId().equals(app.getId())) continue;
                        
                        String sanitizedName = toKubernetesName(other.getName()).toUpperCase().replace("-", "_");
                        env.put("SERVICE_" + sanitizedName + "_URL", "http://" + toKubernetesName(other.getName()) + "-svc");
                }

                // Explicit ReactFlow Connections (Highest priority, can override or add specific links)
                List<ServiceConnection> connections = connectionService.getOutgoingConnections(app.getId());
                for (ServiceConnection conn : connections) {
                        Application target = applicationService.getApplication(conn.getTargetAppId());
                        String targetName = toKubernetesName(target.getName());
                        String envPrefix = "CONNECTION_" + targetName.toUpperCase().replace("-", "_");
                        
                        env.put(envPrefix + "_URL", "http://" + targetName + "-svc");
                        env.put(envPrefix + "_HOST", targetName + "-svc");
                        env.put(envPrefix + "_PORT", "80");
                }

                // Always override PORT to match the detected containerPort
                env.put("PORT", String.valueOf(containerPort));
                env.putIfAbsent("HOST", "0.0.0.0");
                return env;
        }

        /**
         * Detect the container port from the Docker image's EXPOSE directive.
         * Uses minikube ssh to query the registry v2 API from inside the VM.
         * Falls back to user's PORT env var, then to defaultContainerPort.
         */
        private int detectPortFromImage(String imageTag, Application app) {
                try {
                        // imageTag format: "host:port/repo:tag"
                        int firstSlash = imageTag.indexOf('/');
                        if (firstSlash < 0) return resolveContainerPort(app);
                        
                        String registryHost = imageTag.substring(0, firstSlash);
                        String repoAndTag = imageTag.substring(firstSlash + 1);
                        String[] parts = repoAndTag.split(":");
                        String repo = parts[0];
                        String tag = parts.length > 1 ? parts[1] : "latest";

                        // Use minikube ssh to curl the registry from inside the VM
                        // Step 1: Get the manifest to find config digest
                        String manifestCmd = String.format(
                                "curl -s -H 'Accept: application/vnd.oci.image.manifest.v1+json,application/vnd.docker.distribution.manifest.v2+json' http://%s/v2/%s/manifests/%s",
                                registryHost, repo, tag);
                        
                        ProcessBuilder pb1 = new ProcessBuilder("minikube", "ssh", "--", manifestCmd);
                        pb1.redirectErrorStream(true);
                        Process p1 = pb1.start();
                        String manifestJson = new String(p1.getInputStream().readAllBytes());
                        p1.waitFor(10, java.util.concurrent.TimeUnit.SECONDS);
                        
                        var objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
                        var manifest = objectMapper.readTree(manifestJson);
                        String configDigest = manifest.path("config").path("digest").asText();
                        
                        if (configDigest.isEmpty()) {
                                log.warn("No config digest in manifest for {}", imageTag);
                                return resolveContainerPort(app);
                        }

                        // Step 2: Get the config blob to find ExposedPorts
                        String configCmd = String.format(
                                "curl -s http://%s/v2/%s/blobs/%s",
                                registryHost, repo, configDigest);
                        
                        ProcessBuilder pb2 = new ProcessBuilder("minikube", "ssh", "--", configCmd);
                        pb2.redirectErrorStream(true);
                        Process p2 = pb2.start();
                        String configJson = new String(p2.getInputStream().readAllBytes());
                        p2.waitFor(10, java.util.concurrent.TimeUnit.SECONDS);
                        
                        var config = objectMapper.readTree(configJson);
                        var exposedPorts = config.path("config").path("ExposedPorts");
                        if (!exposedPorts.isMissingNode() && exposedPorts.fieldNames().hasNext()) {
                                String portSpec = exposedPorts.fieldNames().next(); // e.g. "8080/tcp"
                                String portNum = portSpec.split("/")[0];
                                int detectedPort = Integer.parseInt(portNum);
                                log.info("Detected EXPOSE port {} from image {}", detectedPort, imageTag);
                                return detectedPort;
                        }

                        log.info("No EXPOSE port found in image {}, falling back to resolveContainerPort", imageTag);
                } catch (Exception e) {
                        log.warn("Failed to detect port from image {}: {}", imageTag, e.getMessage());
                }
                return resolveContainerPort(app);
        }

        private int resolveContainerPort(Application app) {
                String rawPort = app.getEnvVars() == null ? null : app.getEnvVars().get("PORT");
                if (rawPort == null || rawPort.isBlank()) {
                        return defaultContainerPort;
                }

                try {
                        int parsed = Integer.parseInt(rawPort.trim());
                        return parsed > 0 && parsed <= 65535 ? parsed : defaultContainerPort;
                } catch (NumberFormatException ignored) {
                        return defaultContainerPort;
                }
        }


        private void ensureNamespace(Project project) {
                String namespace = project.getK8sNamespace();
                if (kubernetesClient.namespaces().withName(namespace).get() != null) {
                        return;
                }

                log.warn("Namespace '{}' missing; recreating it before deployment reconciliation", namespace);
                kubernetesClient.namespaces().resource(
                                new NamespaceBuilder()
                                                .withNewMetadata()
                                                .withName(namespace)
                                                .addToLabels("managed-by", "ork8stra")
                                                .addToLabels("project-id", project.getId().toString())
                                                .endMetadata()
                                                .build())
                                .createOrReplace();
        }

        private void scaleApplication(Application app, Project project, int replicas) {
                String namespace = project.getK8sNamespace();
                String deploymentName = resolveDeploymentName(app, project);

                if (kubernetesClient.apps().deployments().inNamespace(namespace).withName(deploymentName).get() != null) {
                        kubernetesClient.apps().deployments()
                                        .inNamespace(namespace)
                                        .withName(deploymentName)
                                        .scale(replicas);
                } else {
                        log.warn("Deployment '{}' not found in namespace '{}'. Cannot scale to {}.", deploymentName, namespace, replicas);
                }
        }

        private String resolveDeploymentName(Application app, Project project) {
                String namespace = project.getK8sNamespace();
                String preferred = toKubernetesName(app.getName()) + "-deploy";

                if (kubernetesClient.apps().deployments().inNamespace(namespace).withName(preferred).get() != null) {
                        return preferred;
                }

                return app.getName() + "-deploy";
        }

        private void updateLatestDeploymentStatus(UUID appId, DeploymentStatus status, int replicas) {
                Optional<Deployment> latest = deploymentRepository.findFirstByApplicationIdOrderByDeployedAtDesc(appId);
                if (latest.isEmpty()) {
                        return;
                }

                Deployment deployment = latest.get();
                deployment.setStatus(status);
                deployment.setReplicas(replicas);
                deploymentRepository.save(deployment);
        }

        private String buildIngressHost(Project project, Application app) {
                String projectPart = toDnsLabel(project.getName());
                String appPart = toDnsLabel(app.getName());

                String effectiveDomain = baseDomain;
                if (effectiveDomain == null || effectiveDomain.isEmpty() || effectiveDomain.contains("AUTO") || effectiveDomain.contains(".sslip.io")) {
                        String nodeIp = discoverNodeIp();
                        if (nodeIp != null) {
                                effectiveDomain = nodeIp + ".sslip.io";
                        }
                }

                return String.format("%s.%s.%s", appPart, projectPart, effectiveDomain);
        }

        private String discoverNodeIp() {
                try {
                        return kubernetesClient.nodes().list().getItems().stream()
                                        .flatMap(node -> node.getStatus().getAddresses().stream())
                                        .filter(addr -> "InternalIP".equals(addr.getType()))
                                        .map(addr -> addr.getAddress())
                                        .findFirst()
                                        .orElse(null);
                } catch (Exception e) {
                        log.warn("Failed to discover node IP for dynamic DNS: {}", e.getMessage());
                        return null;
                }
        }

        private String toKubernetesName(String rawName) {
                String normalized = rawName.toLowerCase().replaceAll("[^a-z0-9-]", "-")
                                .replaceAll("-+", "-")
                                .replaceAll("^-|-$", "");
                return normalized.isBlank() ? "app" : normalized;
        }

        private String toDnsLabel(String value) {
                return toKubernetesName(value);
        }
}
