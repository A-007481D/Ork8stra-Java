package com.ork8stra.deploymentengine;

import com.ork8stra.applicationmanagement.Application;
import com.ork8stra.applicationmanagement.ApplicationService;
import com.ork8stra.buildengine.BuildCompletedEvent;
import com.ork8stra.projectmanagement.Project;
import com.ork8stra.projectmanagement.ProjectService;
import io.fabric8.kubernetes.api.model.EnvVar;
import io.fabric8.kubernetes.api.model.IntOrString;
import io.fabric8.kubernetes.api.model.ServiceBuilder;
import io.fabric8.kubernetes.api.model.apps.DeploymentBuilder;
import io.fabric8.kubernetes.api.model.networking.v1.IngressBuilder;
import io.fabric8.kubernetes.api.model.networking.v1.IngressTLSBuilder;
import io.fabric8.kubernetes.client.KubernetesClient;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DeploymentService {

        private final DeploymentRepository deploymentRepository;
        private final KubernetesClient kubernetesClient;
        private final ApplicationService applicationService;
        private final ProjectService projectService;

        @Value("${kubelite.base-domain}")
        private String baseDomain;

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

        private void deploy(Application app, Project project, String imageTag) {
                String namespace = project.getK8sNamespace();
                String resourceName = toKubernetesName(app.getName());
                String deploymentName = resourceName + "-deploy";

                Deployment deployment = new Deployment(app.getId(), imageTag);
                deploymentRepository.save(deployment);

                kubernetesClient.apps().deployments().inNamespace(namespace).resource(
                                new DeploymentBuilder()
                                                .withNewMetadata()
                                                .withName(deploymentName)
                                                .addToLabels("app", resourceName)
                                                .endMetadata()
                                                .withNewSpec()
                                                .withReplicas(1)
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
                                                .withContainerPort(8080)
                                                .endPort()
                                                .withEnv(app.getEnvVars().entrySet().stream()
                                                                .map(e -> new EnvVar(
                                                                                e.getKey(), e.getValue(), null))
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
                                                .withTargetPort(new IntOrString(8080))
                                                .endPort()
                                                .withType("ClusterIP")
                                                .endSpec()
                                                .build())
                                .createOrReplace();

                String projectPart = toDnsLabel(project.getName());
                String appPart = toDnsLabel(app.getName());
                String host = String.format("%s.%s.%s", appPart, projectPart, baseDomain);

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

                String finalUrl = "https://" + host;
                deployment.setIngressUrl(finalUrl);
                deployment.setStatus(DeploymentStatus.HEALTHY);
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

                kubernetesClient.apps().deployments()
                                .inNamespace(namespace)
                                .withName(deploymentName)
                                .rolling().restart();

                updateLatestDeploymentStatus(app.getId(), DeploymentStatus.RESTARTING, 1);
        }

        private void scaleApplication(Application app, Project project, int replicas) {
                String namespace = project.getK8sNamespace();
                String deploymentName = resolveDeploymentName(app, project);

                kubernetesClient.apps().deployments()
                                .inNamespace(namespace)
                                .withName(deploymentName)
                                .scale(replicas);
        }

        private String resolveDeploymentName(Application app, Project project) {
                String namespace = project.getK8sNamespace();
                String preferred = toKubernetesName(app.getName()) + "-deploy";

                if (kubernetesClient.apps().deployments().inNamespace(namespace).withName(preferred).get() != null) {
                        return preferred;
                }

                return app.getName() + "-deploy";
        }

        private String getLatestDeploymentUrl(java.util.UUID appId) {
                return deploymentRepository.findFirstByApplicationIdOrderByDeployedAtDesc(appId)
                                .map(Deployment::getIngressUrl)
                                .orElse(null);
        }

        private void updateLatestDeploymentStatus(java.util.UUID appId, DeploymentStatus status, int replicas) {
                Optional<Deployment> latest = deploymentRepository.findFirstByApplicationIdOrderByDeployedAtDesc(appId);
                if (latest.isEmpty()) {
                        return;
                }

                Deployment deployment = latest.get();
                deployment.setStatus(status);
                deployment.setReplicas(replicas);
                deploymentRepository.save(deployment);
        }

        private String toKubernetesName(String rawName) {
                String normalized = rawName.toLowerCase().replaceAll("[^a-z0-9-]", "-")
                                .replaceAll("-+", "-")
                                .replaceAll("^-|-$", "");
                return normalized.isBlank() ? "app" : normalized;
        }

        private String toDnsLabel(String value) {
                String normalized = value.toLowerCase().replaceAll("[^a-z0-9]", "");
                return normalized.isBlank() ? "app" : normalized;
        }
}
