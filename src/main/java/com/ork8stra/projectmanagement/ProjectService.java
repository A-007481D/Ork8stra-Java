package com.ork8stra.projectmanagement;

import io.fabric8.kubernetes.api.model.NamespaceBuilder;
import io.fabric8.kubernetes.client.KubernetesClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

//@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final KubernetesClient kubernetesClient;

    @Transactional
    public Project createProject(String name, String ownerId) {
        Project project = new Project(name, ownerId);

        // Create K8s Namespace
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
}
