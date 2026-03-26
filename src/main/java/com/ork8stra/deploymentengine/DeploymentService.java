package com.ork8stra.deploymentengine;

import com.ork8stra.applicationmanagement.Application;
import com.ork8stra.applicationmanagement.ApplicationService;
import com.ork8stra.applicationmanagement.ServiceConnection;
import com.ork8stra.applicationmanagement.ServiceConnectionService;
import com.ork8stra.buildengine.BuildCompletedEvent;
import com.ork8stra.notification.NotificationService;
import com.ork8stra.notification.NotificationType;
import com.ork8stra.projectmanagement.Project;
import com.ork8stra.projectmanagement.ProjectService;
import io.fabric8.kubernetes.api.model.EnvVar;
import io.fabric8.kubernetes.api.model.IntOrString;
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
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeploymentService {

        private final DeploymentRepository deploymentRepository;
        private final KubernetesClient kubernetesClient;
        private final ApplicationService applicationService;
        private final ProjectService projectService;
        private final ServiceConnectionService connectionService;
        private final DeploymentEventService deploymentEventService;
        private final NotificationService notificationService;

        @Value("${kubelite.base-domain}")
        private String baseDomain;

        @Value("${kubelite.default-container-port:8080}")
        private int defaultContainerPort;
        
        private static final int DISCOVERY_SERVER_PORT = 8761;

        public void setBaseDomain(String baseDomain) {
             this.baseDomain = baseDomain;
        }

        @ApplicationModuleListener
        @Transactional(propagation = Propagation.REQUIRES_NEW)
        public void onBuildCompleted(BuildCompletedEvent event) {
                Application app = applicationService.getApplication(event.applicationId());
                Project project = projectService.getProjectById(app.getProjectId());
                
                // Find existing deployment for this build if any
                Deployment deployment = deploymentRepository.findFirstByApplicationIdOrderByDeployedAtDesc(app.getId())
                        .filter(d -> d.getStatus() == DeploymentStatus.IN_PROGRESS && (event.imageTag() == null || d.getVersion().equals(event.imageTag())))
                        .orElse(null);

                if (!event.success()) {
                        log.error("Build failed for app {}. Marking deployment as FAILED.", event.applicationId());
                        if (deployment != null) {
                                deployment.setStatus(DeploymentStatus.FAILED);
                                // Mark build stage as failed
                                updateStageStatus(deployment, DeploymentLogService.STAGE_BUILD, DeploymentStage.PipelineStatus.FAILED);
                                deploymentRepository.save(deployment);
                                deploymentEventService.broadcastUpdate(deployment);
                        }
                        
                        notificationService.sendNotification(event.userId(), NotificationType.DEPLOY_FAILED,
                                "Build Failed", "Application '" + app.getName() + "' failed to build.");
                        return;
                }

                if (deployment != null) {
                    log.info("Continuing deployment pipeline for existing deployment {}", deployment.getId());
                    // Mark Prep and Build stages as success
                    updateStageStatus(deployment, DeploymentLogService.STAGE_PREPARE, DeploymentStage.PipelineStatus.SUCCESS);
                    updateStageStatus(deployment, DeploymentLogService.STAGE_BUILD, DeploymentStage.PipelineStatus.SUCCESS);
                }

                deploy(app, project, event.imageTag(), event.userId());
        }

        @Transactional
        public Deployment triggerBuildDeployment(Application app, Project project, String imageTag, UUID userId) {
                Deployment deployment = new Deployment(app.getId(), imageTag);
                deployment.setUserId(userId);
                initializeStages(deployment);
                deployment.setStatus(DeploymentStatus.IN_PROGRESS);
                deploymentRepository.save(deployment);

                // Start build stage
                updateStageStatus(deployment, DeploymentLogService.STAGE_BUILD, DeploymentStage.PipelineStatus.RUNNING);
                
                return deployment;
        }

        @Transactional
        public Deployment deploy(Application app, Project project, String imageTag, UUID userId) {
                // Try to find an existing IN_PROGRESS deployment for this build
                Deployment deployment = deploymentRepository.findFirstByApplicationIdOrderByDeployedAtDesc(app.getId())
                        .filter(d -> d.getStatus() == DeploymentStatus.IN_PROGRESS && d.getVersion().equals(imageTag))
                        .orElse(null);

                if (deployment == null) {
                    deployment = new Deployment(app.getId(), imageTag);
                    deployment.setUserId(userId);
                    initializeStages(deployment);
                    deployment.setStatus(DeploymentStatus.IN_PROGRESS);
                }
                
                deploymentRepository.save(deployment);

                // Start Rollout Stage
                updateStageStatus(deployment, DeploymentLogService.STAGE_ROLLOUT, DeploymentStage.PipelineStatus.RUNNING);

                String ingressUrl = applyRuntimeResources(app, project, imageTag, 1);
                deployment.setIngressUrl(ingressUrl);
                deployment.setReplicas(1);
                // DO NOT set HEALTHY here. Let ServiceHealthWatcher reconcile it once pods are actually ready.
                
                deploymentRepository.save(deployment);

                notificationService.sendNotification(deployment.getUserId(), NotificationType.DEPLOY_SUCCESS,
                        "Deployment Successful", "Application '" + app.getName() + "' is now live!");

                deploymentEventService.broadcastUpdate(deployment);
                return deployment;
        }

        public void initializeStages(Deployment deployment) {
                if (deployment.getStages() == null) {
                    deployment.setStages(new ArrayList<>());
                } else if (!deployment.getStages().isEmpty()) {
                    return;
                }
                
                log.info("Initializing baseline stages for deployment {}", deployment.getId());

                // Stage 1: Preparation (Git Clone)
                DeploymentStage prepStage = DeploymentStage.builder()
                                .name(DeploymentLogService.STAGE_PREPARE)
                                .status(DeploymentStage.PipelineStatus.PENDING)
                                .orderIndex(0)
                                .deployment(deployment)
                                .estimatedDuration(30L)
                                .build();
                prepStage.getSteps().add(DeploymentStep.builder().name("Fetching Source").status(DeploymentStage.PipelineStatus.PENDING).build());

                // Stage 2: Artifact Construction (Nixpacks + Kaniko)
                DeploymentStage buildStage = DeploymentStage.builder()
                                .name(DeploymentLogService.STAGE_BUILD)
                                .status(DeploymentStage.PipelineStatus.PENDING)
                                .orderIndex(1)
                                .deployment(deployment)
                                .estimatedDuration(300L)
                                .build();
                buildStage.getSteps().add(DeploymentStep.builder().name("Nixpacks Analysis").status(DeploymentStage.PipelineStatus.PENDING).build());
                buildStage.getSteps().add(DeploymentStep.builder().name("Kaniko Build & Push").status(DeploymentStage.PipelineStatus.PENDING).build());

                // Stage 3: Cluster Rollout
                DeploymentStage deployStage = DeploymentStage.builder()
                                .name(DeploymentLogService.STAGE_ROLLOUT)
                                .status(DeploymentStage.PipelineStatus.PENDING)
                                .orderIndex(2)
                                .deployment(deployment)
                                .estimatedDuration(120L)
                                .build();
                deployStage.getSteps().add(DeploymentStep.builder().name("K8s Resource Apply").status(DeploymentStage.PipelineStatus.PENDING).build());
                deployStage.getSteps().add(DeploymentStep.builder().name("Pod Readiness Check").status(DeploymentStage.PipelineStatus.PENDING).build());

                deployment.getStages().addAll(List.of(prepStage, buildStage, deployStage));
                deploymentRepository.saveAndFlush(deployment);
        }

        private void updateStageStatus(Deployment deployment, String stageName, DeploymentStage.PipelineStatus status) {
                deployment.getStages().stream()
                                .filter(s -> s.getName().equals(stageName))
                                .findFirst()
                                .ifPresent(s -> {
                                        s.setStatus(status);
                                        if (status == DeploymentStage.PipelineStatus.RUNNING && s.getStartTime() == null) {
                                                s.setStartTime(Instant.now());
                                        }
                                        if (status == DeploymentStage.PipelineStatus.SUCCESS || status == DeploymentStage.PipelineStatus.FAILED) {
                                                s.setEndTime(Instant.now());
                                                s.getSteps().forEach(step -> step.setStatus(status));
                                        }
                                        deploymentEventService.broadcastUpdate(deployment);
                                });
        }

        @Transactional
        public void reconcileLatestDeployment(Application app, Project project, Deployment deployment) {
                try {
                        String namespace = project.getK8sNamespace();
                        String deploymentName = resolveDeploymentName(app, project);
                        var k8sDeployment = kubernetesClient.apps().deployments().inNamespace(namespace).withName(deploymentName).get();
                        
                        if (k8sDeployment == null) {
                                // If it doesn't exist, we must re-apply or mark as STOPPED/FAILED
                                String ingressUrl = applyRuntimeResources(app, project, deployment.getVersion(), deployment.getReplicas());
                                deployment.setIngressUrl(ingressUrl);
                                deploymentRepository.save(deployment);
                                return;
                        }

                        // Use actual status from k8s if possible
                        var status = k8sDeployment.getStatus();
                        var spec = k8sDeployment.getSpec();
                        int desired = spec.getReplicas() != null ? spec.getReplicas() : 0;
                        int ready = (status != null && status.getReadyReplicas() != null) ? status.getReadyReplicas() : 0;

                        if (desired == 0) {
                                deployment.setStatus(DeploymentStatus.STOPPED);
                        } else if (ready >= desired) {
                                deployment.setStatus(DeploymentStatus.HEALTHY);
                        } else {
                                deployment.setStatus(DeploymentStatus.IN_PROGRESS);
                        }
                        
                        deploymentRepository.save(deployment);
                } catch (Exception e) {
                        log.warn("Manual reconciliation failed for app {}: {}", app.getName(), e.getMessage());
                        // Stay in previous status
                }
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
                verifyErrorHandler(project);

                kubernetesClient.apps().deployments().inNamespace(namespace).resource(
                                new DeploymentBuilder()
                                                .withNewMetadata()
                                                .withName(deploymentName)
                                                .addToLabels("app", resourceName)
                                                .addToLabels("managed-by", "ork8stra")
                                                .addToAnnotations("ork8stra.com/app-id", app.getId().toString())
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
                                                .addToAnnotations("ork8stra.com/app-id", app.getId().toString())
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
                                                .addToLabels("managed-by", "ork8stra")
                                                .endMetadata()
                                                .withNewSpec()
                                                .withSelector(Collections.singletonMap("app", resourceName))
                                                .addNewPort()
                                                .withName("http")
                                                .withPort(80)
                                                .withTargetPort(new IntOrString(detectContainerPort(app, imageTag)))
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
                                .addToLabels("managed-by", "ork8stra")
                                .addToAnnotations("cert-manager.io/cluster-issuer", "kubelite-selfsigned")
                                .addToAnnotations("nginx.ingress.kubernetes.io/ssl-redirect", "true")
                                .addToAnnotations("nginx.ingress.kubernetes.io/rewrite-target", "/$2")
                                .addToAnnotations("nginx.ingress.kubernetes.io/custom-http-errors", "502,503")
                                .addToAnnotations("nginx.ingress.kubernetes.io/default-backend", "kubelite-error-handler")
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
        private int detectContainerPort(Application app, String imageTag) {
                // If explicitly set in app metadata, use it
                if (app.getContainerPort() != null && app.getContainerPort() > 0) {
                        return app.getContainerPort();
                }

                // If Discovery Server, use 8761
                if (app.getName().toLowerCase().contains("discovery-server")) {
                        log.info("Detected Discovery Server '{}', defaulting to port {}", app.getName(), DISCOVERY_SERVER_PORT);
                        return DISCOVERY_SERVER_PORT;
                }

                // Try image detection
                int detected = detectPortFromImage(imageTag, app);
                if (detected != defaultContainerPort) {
                        return detected;
                }

                // Fallback to env or default
                return resolveContainerPort(app);
        }

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
                        log.info("No EXPOSE port found in image {}, check Application config", imageTag);
                } catch (Exception e) {
                        log.warn("Failed to detect port from image {}: {}. Falling back to default/env.", imageTag, e.getMessage());
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
                projectService.ensureNamespace(project);
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

        private void verifyErrorHandler(Project project) {
                String namespace = project.getK8sNamespace();
                String handlerName = "kubelite-error-handler";
                if (kubernetesClient.apps().deployments().inNamespace(namespace).withName(handlerName).get() == null) {
                        ensureErrorHandler(project);
                }
        }

        private void ensureErrorHandler(Project project) {
                String namespace = project.getK8sNamespace();
                String handlerName = "kubelite-error-handler";

                String nginxConf = "events { worker_connections 1024; }\n" +
                        "http {\n" +
                        "    include mime.types;\n" +
                        "    default_type application/octet-stream;\n" +
                        "    server {\n" +
                        "        listen 80;\n" +
                        "        error_page 404 500 502 503 504 /error.html;\n" +
                        "        location / {\n" +
                        "            return 503;\n" +
                        "        }\n" +
                        "        location = /error.html {\n" +
                        "            root /usr/share/nginx/html;\n" +
                        "            internal;\n" +
                        "        }\n" +
                        "    }\n" +
                        "}\n";

                String nodeIp = discoverNodeIp();
                String apiBase = (nodeIp != null) ? "https://ork8stra." + nodeIp + ".sslip.io" : "https://ork8stra." + baseDomain;

                String errorHtml = "<!DOCTYPE html>\n" +
                        "<html lang=\"en\">\n" +
                        "<head>\n" +
                        "    <meta charset=\"UTF-8\">\n" +
                        "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                        "    <title>Application Status | KubeLite</title>\n" +
                        "    <style>\n" +
                        "        body { margin: 0; padding: 0; background-color: #0A0A0A; color: #E3E3E3; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column; text-align: center; }\n" +
                        "        .spinner { width: 40px; height: 40px; border: 3px solid rgba(255, 255, 255, 0.1); border-radius: 50%; border-top-color: #10B981; animation: spin 1s ease-in-out infinite; margin-bottom: 20px; }\n" +
                        "        @keyframes spin { to { transform: rotate(360deg); } }\n" +
                        "        h1 { font-size: 24px; font-weight: 500; margin: 0 0 8px 0; letter-spacing: -0.5px; }\n" +
                        "        p { color: #888; font-size: 14px; margin: 0; }\n" +
                        "        .container { background: #111; padding: 40px 60px; border-radius: 12px; border: 1px solid #222; box-shadow: 0 8px 32px rgba(0,0,0,0.4); display: flex; flex-direction: column; align-items: center; min-width: 320px; }\n" +
                        "        .brand { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #444; margin-top: 30px; font-weight: bold; }\n" +
                        "        .status-badge { font-size: 10px; text-transform: uppercase; padding: 4px 8px; border-radius: 4px; background: #222; color: #10B981; margin-bottom: 12px; font-weight: bold; letter-spacing: 1px; }\n" +
                        "    </style>\n" +
                        "</head>\n" +
                        "<body>\n" +
                        "    <div class=\"container\">\n" +
                        "        <div id=\"status-badge\" class=\"status-badge\">PROVISIONING</div>\n" +
                        "        <div id=\"loader\" class=\"spinner\"></div>\n" +
                        "        <h1 id=\"main-title\">Application is Starting</h1>\n" +
                        "        <p id=\"sub-text\">Your pod is spinning up. Hang tight, this page will auto-refresh.</p>\n" +
                        "    </div>\n" +
                        "    <div class=\"brand\">Powered by KubeLite</div>\n" +
                        "    <script>\n" +
                        "        const apiBase = \"" + apiBase + "\";\n" +
                        "        const host = window.location.hostname;\n" +
                        "        \n" +
                        "        async function checkStatus() {\n" +
                        "            try {\n" +
                        "                const resp = await fetch(`${apiBase}/api/v1/public/app-status?host=${host}`);\n" +
                        "                if (resp.ok) {\n" +
                        "                    const data = await resp.json();\n" +
                        "                    updateUI(data.status);\n" +
                        "                }\n" +
                        "            } catch (e) { console.error(\"Status check failed\", e); }\n" +
                        "        }\n" +
                        "\n" +
                        "        function updateUI(status) {\n" +
                        "            const title = document.getElementById('main-title');\n" +
                        "            const sub = document.getElementById('sub-text');\n" +
                        "            const badge = document.getElementById('status-badge');\n" +
                        "            const loader = document.getElementById('loader');\n" +
                        "\n" +
                        "            badge.innerText = status;\n" +
                        "            \n" +
                        "            if (status === 'STOPPED') {\n" +
                        "                title.innerText = \"Application is Sleeping\";\n" +
                        "                sub.innerText = \"This service has been suspended to save resources. Start it from your dashboard to wake it up.\";\n" +
                        "                loader.style.display = 'none';\n" +
                        "                badge.style.color = '#6B7280';\n" +
                        "            } else if (status === 'RESTARTING') {\n" +
                        "                title.innerText = \"Application is Restarting\";\n" +
                        "                sub.innerText = \"We're applying updates or scaling resources. It'll be back in a moment.\";\n" +
                        "                loader.style.display = 'block';\n" +
                        "                badge.style.color = '#F59E0B';\n" +
                        "            } else if (status === 'HEALTHY' || status === 'SUCCESS') {\n" +
                        "                // If it's healthy but we're still seeing the error page, it's likely ingress propagation\n" +
                        "                window.location.reload();\n" +
                        "            }\n" +
                        "        }\n" +
                        "\n" +
                        "        setInterval(checkStatus, 3000);\n" +
                        "        checkStatus();\n" +
                        "    </script>\n" +
                        "</body>\n" +
                        "</html>\n";

                kubernetesClient.configMaps().inNamespace(namespace).resource(
                        new io.fabric8.kubernetes.api.model.ConfigMapBuilder()
                                .withNewMetadata()
                                .withName(handlerName + "-config")
                                .endMetadata()
                                .addToData("nginx.conf", nginxConf)
                                .addToData("error.html", errorHtml)
                                .build()
                ).createOrReplace();

                // 2. Deployment
                kubernetesClient.apps().deployments().inNamespace(namespace).resource(
                        new io.fabric8.kubernetes.api.model.apps.DeploymentBuilder()
                                .withNewMetadata()
                                .withName(handlerName)
                                .addToLabels("app", handlerName)
                                .endMetadata()
                                .withNewSpec()
                                .withReplicas(1)
                                .withNewSelector()
                                .addToMatchLabels("app", handlerName)
                                .endSelector()
                                .withNewTemplate()
                                .withNewMetadata()
                                .addToLabels("app", handlerName)
                                .endMetadata()
                                .withNewSpec()
                                .addNewContainer()
                                .withName(handlerName)
                                .withImage("nginx:alpine")
                                .addNewPort().withContainerPort(80).endPort()
                                .addNewVolumeMount()
                                .withName("config-volume")
                                .withMountPath("/etc/nginx/nginx.conf")
                                .withSubPath("nginx.conf")
                                .endVolumeMount()
                                .addNewVolumeMount()
                                .withName("html-volume")
                                .withMountPath("/usr/share/nginx/html/error.html")
                                .withSubPath("error.html")
                                .endVolumeMount()
                                .endContainer()
                                .addNewVolume()
                                .withName("config-volume")
                                .withNewConfigMap().withName(handlerName + "-config").endConfigMap()
                                .endVolume()
                                .addNewVolume()
                                .withName("html-volume")
                                .withNewConfigMap().withName(handlerName + "-config").endConfigMap()
                                .endVolume()
                                .endSpec()
                                .endTemplate()
                                .endSpec()
                                .build()
                ).createOrReplace();

                // 3. Service
                kubernetesClient.services().inNamespace(namespace).resource(
                        new io.fabric8.kubernetes.api.model.ServiceBuilder()
                                .withNewMetadata()
                                .withName(handlerName)
                                .addToLabels("app", handlerName)
                                .endMetadata()
                                .withNewSpec()
                                .withSelector(java.util.Collections.singletonMap("app", handlerName))
                                .addNewPort()
                                .withName("http")
                                .withPort(80)
                                .withTargetPort(new io.fabric8.kubernetes.api.model.IntOrString(80))
                                .endPort()
                                .withType("ClusterIP")
                                .endSpec()
                                .build()
                ).createOrReplace();
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
