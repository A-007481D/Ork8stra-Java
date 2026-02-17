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
    public Project createProject(String name, UUID organizationId) {
        Project project = new Project(name, organizationId);

        kubernetesClient.namespaces().resource(
                new NamespaceBuilder()
                        .withNewMetadata()
                        .withName(project.getK8sNamespace())
                        .addToLabels("managed-by", "ork8stra")
                        .addToLabels("project-id", project.getId().toString())
                        .endMetadata()
                        .build())
                .create();

        return projectRepository.save(project);
    }

    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    public Project getProjectById(UUID id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + id));
    }

    @Transactional
    public void deleteProject(UUID id) {
        Project project = getProjectById(id);
        kubernetesClient.namespaces().withName(project.getK8sNamespace()).delete();
        projectRepository.delete(project);
    }
}
