package com.ork8stra.buildengine;

import com.ork8stra.applicationmanagement.Application;
import com.ork8stra.applicationmanagement.ApplicationService;
import com.ork8stra.projectmanagement.Project;
import com.ork8stra.projectmanagement.ProjectService;
import com.ork8stra.deploymentengine.Deployment;
import com.ork8stra.deploymentengine.DeploymentRepository;
import com.ork8stra.deploymentengine.DeploymentStatus;
import io.fabric8.kubernetes.api.model.apps.DeploymentBuilder;
import io.fabric8.kubernetes.client.KubernetesClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class RollbackService {

    private final BuildRepository buildRepository;
    private final ApplicationService applicationService;
    private final ProjectService projectService;
    private final KubernetesClient kubernetesClient;
    private final DeploymentRepository deploymentRepository;

    public Build rollbackToVersion(UUID applicationId, UUID targetBuildId) {
        Build targetBuild = buildRepository.findById(targetBuildId)
                .orElseThrow(() -> new IllegalArgumentException("Build not found: " + targetBuildId));

        if (targetBuild.getStatus() != BuildStatus.SUCCESS) {
            throw new IllegalStateException("Can only rollback to a successful build");
        }

        if (!targetBuild.getApplicationId().equals(applicationId)) {
            throw new IllegalArgumentException("Build does not belong to this application");
        }

        Application app = applicationService.getApplication(applicationId);
        Project project = projectService.getProjectById(app.getProjectId());
        String imageTag = targetBuild.getImageTag();
        String namespace = project.getK8sNamespace();
        String deploymentName = resolveDeploymentName(app.getName(), namespace);

        log.info("Rolling back app '{}' to image '{}'", app.getName(), imageTag);

        kubernetesClient.apps().deployments()
                .inNamespace(namespace)
                .withName(deploymentName)
                .edit(d -> new DeploymentBuilder(d)
                        .editSpec()
                        .editTemplate()
                        .editSpec()
                        .editFirstContainer()
                        .withImage(imageTag)
                        .endContainer()
                        .endSpec()
                        .endTemplate()
                        .endSpec()
                        .build());

        Deployment rollbackDeployment = new Deployment(applicationId, imageTag);
        deploymentRepository.findFirstByApplicationIdOrderByDeployedAtDesc(applicationId)
                .ifPresent(previous -> rollbackDeployment.setIngressUrl(previous.getIngressUrl()));
        rollbackDeployment.setStatus(DeploymentStatus.HEALTHY);
        deploymentRepository.save(rollbackDeployment);

        log.info("Rollback complete for app '{}' to build '{}'", app.getName(), targetBuildId);
        return targetBuild;
    }

    private String resolveDeploymentName(String appName, String namespace) {
        String sanitized = appName.toLowerCase().replaceAll("[^a-z0-9-]", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
        String preferred = (sanitized.isBlank() ? "app" : sanitized) + "-deploy";

        if (kubernetesClient.apps().deployments().inNamespace(namespace).withName(preferred).get() != null) {
            return preferred;
        }

        return appName + "-deploy";
    }
}
