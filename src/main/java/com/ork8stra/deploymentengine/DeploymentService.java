package com.ork8stra.deploymentengine;

import com.ork8stra.applicationmanagement.Application;
import com.ork8stra.applicationmanagement.ApplicationService;
import com.ork8stra.buildengine.BuildCompletedEvent;
import com.ork8stra.projectmanagement.Project;
import com.ork8stra.projectmanagement.ProjectService;
import io.fabric8.kubernetes.api.model.EnvVar;
import io.fabric8.kubernetes.api.model.IntOrString;
import io.fabric8.kubernetes.api.model.NamespaceBuilder;
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

import java.util.Collections;
import java.util.LinkedHashMap;
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
                int containerPort = resolveContainerPort(app);
                Map<String, String> envVars = buildRuntimeEnv(app);

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
                                                .endMetadata()
                                                .withNewSpec()
                                                .addNewContainer()
                                                .withName(resourceName)
                                                .withImage(imageTag)
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
                                                .withPort(80)
                                                .withTargetPort(new IntOrString(containerPort))
                                                .endPort()
                                                .withType("ClusterIP")
                                                .endSpec()
                                                .build())
                                .createOrReplace();

                String host = buildIngressHost(project, app);

                kubernetesClient.network().v1().ingresses().inNamespace(namespace).resource(
                                new IngressBuilder()
                                                .withNewMetadata()
                                                .withName(resourceName + "-ingress")
                                                .addToLabels("app", resourceName)
                                                .addToAnnotations("cert-manager.io/cluster-issuer", "kubelite-selfsigned")
                                                .addToAnnotations("nginx.ingress.kubernetes.io/ssl-redirect", "true")
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
                                                .withPath("/")
                                                .withPathType("Prefix")
                                                .withNewBackend()
                                                .withNewService()
                                                .withName(resourceName + "-svc")
                                                .withNewPort()
                                                .withNumber(80)
                                                .endPort()
                                                .endService()
                                                .endBackend()
                                                .endPath()
                                                .endHttp()
                                                .endRule()
                                                .endSpec()
                                                .build())
                                .createOrReplace();

                return "https://" + host;
        }

        private Map<String, String> buildRuntimeEnv(Application app) {
                Map<String, String> env = new LinkedHashMap<>();
                if (app.getEnvVars() != null) {
                        env.putAll(app.getEnvVars());
                }

                env.putIfAbsent("PORT", String.valueOf(defaultContainerPort));
                env.putIfAbsent("HOST", "0.0.0.0");
                return env;
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
