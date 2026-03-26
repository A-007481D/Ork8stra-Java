package com.ork8stra.deploymentengine;

import com.ork8stra.applicationmanagement.Application;
import com.ork8stra.projectmanagement.Project;
import com.ork8stra.projectmanagement.ProjectService;
import io.fabric8.kubernetes.api.model.batch.v1.Job;
import io.fabric8.kubernetes.client.KubernetesClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class KanikoJobFactoryTest {

    private KubernetesClient kubernetesClient;
    private ProjectService projectService;
    private KanikoJobFactory factory;

    @BeforeEach
    void setUp() {
        kubernetesClient = mock(KubernetesClient.class);
        projectService = mock(ProjectService.class);
        
        // Mock the PVC chain to avoid NPE in ensureCachingPvcs
        var pvcOps = mock(io.fabric8.kubernetes.client.dsl.MixedOperation.class);
        var nsOps = mock(io.fabric8.kubernetes.client.dsl.NonNamespaceOperation.class);
        var resOps = mock(io.fabric8.kubernetes.client.dsl.Resource.class);
        
        when(kubernetesClient.persistentVolumeClaims()).thenReturn(pvcOps);
        when(pvcOps.inNamespace(anyString())).thenReturn(nsOps);
        when(nsOps.withName(anyString())).thenReturn(resOps);
        when(nsOps.resource(any())).thenReturn(resOps);
        when(resOps.get()).thenReturn(null); // Simulate PVC not existing, which triggers creation
        when(resOps.create()).thenReturn(null); // Avoid NPE on .create()

        factory = new KanikoJobFactory(kubernetesClient, projectService);
    }

    @Test
    void createKanikoJob_usesGeneratedDockerfileInAutoMode() {
        UUID projectId = UUID.randomUUID();
        Application app = new Application("node-service", projectId, "https://github.com/acme/node-service", "main");
        app.setDockerfilePath(null);

        Project project = new Project("demo-project", UUID.randomUUID());
        project.setK8sNamespace("demo-ns");

        Job job = factory.createKanikoJob(app, project, "registry.local/demo/node-service:latest", UUID.randomUUID());

        List<String> args = job.getSpec().getTemplate().getSpec().getContainers().getFirst().getArgs();
        assertTrue(args.stream().anyMatch(arg -> arg.contains("--dockerfile=/workspace/.ork8stra.auto.Dockerfile")));

        String nixpacksInitImage = job.getSpec().getTemplate().getSpec().getInitContainers().get(1).getImage();
        assertTrue(nixpacksInitImage.contains("ubuntu"));

        String initScript = job.getSpec().getTemplate().getSpec().getInitContainers().get(1).getCommand().get(2);
        assertTrue(initScript.contains("nixpacks build"));
        assertTrue(initScript.contains("--out \"$TARGET_DIR\""));
    }

    @Test
    void createKanikoJob_usesExplicitDockerfileWhenProvided() {
        UUID projectId = UUID.randomUUID();
        Application app = new Application("java-service", projectId, "https://github.com/acme/java-service", "main");
        app.setDockerfilePath("deploy/Dockerfile");

        Project project = new Project("demo-project", UUID.randomUUID());
        project.setK8sNamespace("demo-ns");

        Job job = factory.createKanikoJob(app, project, "registry.local/demo/java-service:latest", UUID.randomUUID());

        List<String> args = job.getSpec().getTemplate().getSpec().getContainers().getFirst().getArgs();
        assertTrue(args.stream().anyMatch(arg -> arg.equals("--dockerfile=deploy/Dockerfile")));
        assertTrue(args.stream().anyMatch(arg -> arg.equals("--context-sub-path=deploy")));

        assertTrue(job.getSpec().getTemplate().getSpec().getInitContainers().size() == 1);

        String initScript = job.getSpec().getTemplate().getSpec().getInitContainers().getFirst().getCommand().get(2);
        assertFalse(initScript.contains("AUTO_DOCKERFILE"));
    }

    @Test
    void createKanikoJob_treatsLegacyDefaultDockerfileAsAutoMode() {
        UUID projectId = UUID.randomUUID();
        Application app = new Application("legacy-node-service", projectId, "https://github.com/acme/legacy-node-service", "main");
        app.setDockerfilePath("Dockerfile");

        Project project = new Project("demo-project", UUID.randomUUID());
        project.setK8sNamespace("demo-ns");

        Job job = factory.createKanikoJob(app, project, "registry.local/demo/legacy-node-service:latest", UUID.randomUUID());

        List<String> args = job.getSpec().getTemplate().getSpec().getContainers().getFirst().getArgs();
        assertTrue(args.stream().anyMatch(arg -> arg.contains("--dockerfile=/workspace/.ork8stra.auto.Dockerfile")));

        String nixpacksInitImage = job.getSpec().getTemplate().getSpec().getInitContainers().get(1).getImage();
        assertTrue(nixpacksInitImage.contains("ubuntu"));

        String initScript = job.getSpec().getTemplate().getSpec().getInitContainers().get(1).getCommand().get(2);
        assertTrue(initScript.contains("nixpacks build"));
    }
}
