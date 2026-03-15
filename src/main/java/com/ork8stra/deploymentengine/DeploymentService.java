package com.ork8stra.deploymentengine;

import com.ork8stra.applicationmanagement.Application;
import com.ork8stra.applicationmanagement.ApplicationService;
import com.ork8stra.buildengine.BuildCompletedEvent;
import com.ork8stra.projectmanagement.Project;
import com.ork8stra.infrastructure.messaging.EventPublisher;
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

@Service
@RequiredArgsConstructor
public class DeploymentService {

        private final DeploymentRepository deploymentRepository;
        private final KubernetesClient kubernetesClient;
        private final ApplicationService applicationService;
        private final ProjectService projectService;
        private final EventPublisher eventPublisher;

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
                String appName = app.getName();
                String deploymentName = appName + "-deploy";

                Deployment deployment = new Deployment(app.getId(), imageTag);
                deploymentRepository.save(deployment);

                kubernetesClient.apps().deployments().inNamespace(namespace).resource(
                                new DeploymentBuilder()
                                                .withNewMetadata()
                                                .withName(deploymentName)
                                                .addToLabels("app", appName)
                                                .endMetadata()
                                                .withNewSpec()
                                                .withReplicas(1)
                                                .withNewSelector()
                                                .addToMatchLabels("app", appName)
                                                .endSelector()
                                                .withNewTemplate()
                                                .withNewMetadata()
                                                .addToLabels("app", appName)
                                                .endMetadata()
                                                .withNewSpec()
                                                .addNewContainer()
                                                .withName(appName)
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
                                                .withName(appName + "-svc")
                                                .addToLabels("app", appName)
                                                .endMetadata()
                                                .withNewSpec()
                                                .withSelector(Collections.singletonMap("app", appName))
                                                .addNewPort()
                                                .withPort(80)
                                                .withTargetPort(new IntOrString(8080))
                                                .endPort()
                                                .withType("ClusterIP")
                                                .endSpec()
                                                .build())
                                .createOrReplace();

                // Create Ingress
                // Create Ingress with "Premium" hierarchical host
                String projectPart = project.getName().toLowerCase().replaceAll("[^a-z0-9]", "");
                String appPart = appName.toLowerCase().replaceAll("[^a-z0-9]", "");

                // Using sslip.io for transparent wildcard DNS resolution back to minikube
                String host = String.format("%s.%s.%s", appPart, projectPart, baseDomain);

                kubernetesClient.network().v1().ingresses().inNamespace(namespace).resource(
                                new IngressBuilder()
                                                .withNewMetadata()
                                                .withName(appName + "-ingress")
                                                .addToLabels("app", appName)
                                                .addToAnnotations("cert-manager.io/cluster-issuer", "kubelite-selfsigned")
                                                .addToAnnotations("nginx.ingress.kubernetes.io/ssl-redirect", "true")
                                                .endMetadata()
                                                .withNewSpec()
                                                .withTls(new IngressTLSBuilder()
                                                                .addToHosts(host)
                                                                .withSecretName(appName + "-tls-secret")
                                                                .build())
                                                .addNewRule()
                                                .withHost(host)
                                                .withNewHttp()
                                                .addNewPath()
                                                .withPath("/")
                                                .withPathType("Prefix")
                                                .withNewBackend()
                                                .withNewService()
                                                .withName(appName + "-svc")
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

                deployment.setStatus(DeploymentStatus.HEALTHY);
                deploymentRepository.save(deployment);

                eventPublisher.publishDeploymentStatus(
                                deployment.getId().toString(),
                                app.getId().toString(),
                                DeploymentStatus.HEALTHY.name());
        }

        public void stopApplication(Application app, Project project) {
                String namespace = project.getK8sNamespace();
                String deploymentName = app.getName() + "-deploy";

                kubernetesClient.apps().deployments()
                                .inNamespace(namespace)
                                .withName(deploymentName)
                                .scale(0);

                eventPublisher.publishDeploymentStatus(
                                null,
                                app.getId().toString(),
                                "STOPPED");
        }

        public void startApplication(Application app, Project project) {
                String namespace = project.getK8sNamespace();
                String deploymentName = app.getName() + "-deploy";

                kubernetesClient.apps().deployments()
                                .inNamespace(namespace)
                                .withName(deploymentName)
                                .scale(1);

                eventPublisher.publishDeploymentStatus(
                                null,
                                app.getId().toString(),
                                "ACTIVE");
        }

        public void restartApplication(Application app, Project project) {
                String namespace = project.getK8sNamespace();
                String deploymentName = app.getName() + "-deploy";

                kubernetesClient.apps().deployments()
                                .inNamespace(namespace)
                                .withName(deploymentName)
                                .rolling().restart();

                eventPublisher.publishDeploymentStatus(
                                null,
                                app.getId().toString(),
                                "RESTARTING");
        }
}
