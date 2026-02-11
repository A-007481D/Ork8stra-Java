package com.ork8stra.deploymentengine;

import com.ork8stra.applicationmanagement.Application;
import com.ork8stra.applicationmanagement.ApplicationService;
import com.ork8stra.buildengine.BuildCompletedEvent;
import com.ork8stra.projectmanagement.Project;
import com.ork8stra.projectmanagement.ProjectService;
import io.fabric8.kubernetes.api.model.IntOrString;
import io.fabric8.kubernetes.api.model.ServiceBuilder;
import io.fabric8.kubernetes.api.model.apps.DeploymentBuilder;
import io.fabric8.kubernetes.client.KubernetesClient;
import lombok.RequiredArgsConstructor;
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

        @ApplicationModuleListener
        @Transactional(propagation = Propagation.REQUIRES_NEW)
        public void onBuildCompleted(BuildCompletedEvent event) {
                if (!event.success()) {
                        return;
                }

                Application app = applicationService.getApplication(event.applicationId());
                
                Project project = projectService.getAllProjects().stream()
                                .filter(p -> p.getId().equals(app.getProjectId()))
                                .findFirst()
                                .orElseThrow(() -> new IllegalStateException(
                                                "Project not found for app: " + app.getId()));

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
                                                                .map(e -> new io.fabric8.kubernetes.api.model.EnvVar(
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

                deployment.setStatus(DeploymentStatus.HEALTHY);
                deploymentRepository.save(deployment);
        }
}
