package com.ork8stra.projectmanagement;

import io.fabric8.kubernetes.api.model.NamespaceBuilder;
import io.fabric8.kubernetes.client.KubernetesClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final KubernetesClient kubernetesClient;

    @Transactional
    public Project createProject(String name, UUID teamId) {
        Project project = new Project(name, teamId);

        try {
            kubernetesClient.namespaces().resource(
                    new NamespaceBuilder()
                            .withNewMetadata()
                            .withName(project.getK8sNamespace())
                            .addToLabels("managed-by", "ork8stra")
                            .addToLabels("project-id", project.getId().toString())
                            .endMetadata()
                            .build())
                    .create();
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(ProjectService.class)
                    .warn("Failed to create K8s namespace for project '{}': {}", name, e.getMessage());
        }

        return projectRepository.save(project);
    }

    public List<Project> getProjectsByTeamId(UUID teamId) {
        return projectRepository.findByTeamId(teamId);
    }

    public Project getProjectById(UUID id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + id));
    }

    public KubernetesClient getKubernetesClient() {
        return kubernetesClient;
    }

    @Transactional
    public void deleteProject(UUID id) {
        Project project = getProjectById(id);
        try {
            kubernetesClient.namespaces().withName(project.getK8sNamespace()).delete();
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(ProjectService.class)
                    .warn("Failed to delete K8s namespace for project '{}': {}", project.getName(), e.getMessage());
        }
        projectRepository.delete(project);
    }
}
