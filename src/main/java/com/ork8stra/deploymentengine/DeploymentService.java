package com.ork8stra.deploymentengine;

import com.ork8stra.applicationmanagement.Application;
import com.ork8stra.applicationmanagement.ApplicationService;
import com.ork8stra.buildengine.BuildCompletedEvent;
import com.ork8stra.projectmanagement.Project;
import com.ork8stra.projectmanagement.ProjectService; // Assuming ProjectService is available or I need to fetch Project via Application
import io.fabric8.kubernetes.api.model.IntOrString;
import io.fabric8.kubernetes.api.model.ServiceBuilder;
import io.fabric8.kubernetes.api.model.apps.DeploymentBuilder;
import io.fabric8.kubernetes.client.KubernetesClient;
import lombok.RequiredArgsConstructor;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;

//@Service
@RequiredArgsConstructor
public class DeploymentService {

        private final DeploymentRepository deploymentRepository;
        private final KubernetesClient kubernetesClient;
        private final ApplicationService applicationService;
        // Note: In a strict Modulith, we might want to avoid direct service
        // dependencies,
        // but for this monolithic setup, it's acceptable for simplicity.
        // We need to get Project ID from Application, then Project details.
        // Let's assume ApplicationService can provide what we need or we fetch Project
        // separately.
        // Actually Application has projectId. We need ProjectService to get namespace.
        // Let's assume we can inject ProjectRepository or Service.
        // For now, I'll add ProjectService dependency.
        private final ProjectService projectService;

        @ApplicationModuleListener
        @Transactional
        public void onBuildCompleted(BuildCompletedEvent event) {
                if (!event.success()) {
                        return;
                }

                Application app = applicationService.getApplication(event.applicationId());
                // We need to find the project to get the namespace.
                // I'll add a method to ProjectService to get Project by ID.
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

                // K8s Deployment
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
                                                .withContainerPort(8080) // Assumption: App runs on 8080
                                                .endPort()
                                                // Add Env Vars
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

                // K8s Service
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

                // Update status
                deployment.setStatus(DeploymentStatus.HEALTHY); // Simplified: should check readiness
                deploymentRepository.save(deployment);
        }
}
