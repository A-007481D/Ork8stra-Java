package com.ork8stra.buildengine;

import io.fabric8.kubernetes.client.KubernetesClient;
import io.fabric8.tekton.client.TektonClient;
import io.fabric8.tekton.pipeline.v1beta1.PipelineRun;
import io.fabric8.tekton.pipeline.v1beta1.PipelineRunBuilder;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

//@Service
@RequiredArgsConstructor
public class BuildService {

    private final BuildRepository buildRepository;
    private final KubernetesClient kubernetesClient;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public Build triggerBuild(UUID applicationId, String gitRepoUrl, String commitHash, String namespace) {
        Build build = new Build(applicationId, commitHash);
        build.setStatus(BuildStatus.RUNNING);

        String pipelineRunName = "build-" + build.getId().toString();
        build.setPipelineRunName(pipelineRunName);

        // Create Tekton PipelineRun
        TektonClient tektonClient = kubernetesClient.adapt(TektonClient.class);

        PipelineRun pipelineRun = new PipelineRunBuilder()
                .withNewMetadata()
                .withName(pipelineRunName)
                .withNamespace(namespace)
                .addToLabels("build-id", build.getId().toString())
                .addToLabels("app-id", applicationId.toString())
                .endMetadata()
                .withNewSpec()
                .withNewPipelineRef()
                .withName("ork8stra-standard-pipeline") // Assuming a standard pipeline exists
                .endPipelineRef()
                .addNewParam()
                .withName("git-url")
                .withNewValue(gitRepoUrl)
                .endParam()
                .addNewParam()
                .withName("commit-hash")
                .withNewValue(commitHash)
                .endParam()
                // Add more params like image registry, etc.
                .endSpec()
                .build();

        tektonClient.v1beta1().pipelineRuns().inNamespace(namespace).resource(pipelineRun).create();

        return buildRepository.save(build);
    }

    @Transactional
    public void updateBuildStatus(UUID buildId, BuildStatus status, String imageTag) {
        Build build = buildRepository.findById(buildId)
                .orElseThrow(() -> new IllegalArgumentException("Build not found: " + buildId));

        build.setStatus(status);
        if (imageTag != null) {
            build.setImageTag(imageTag);
        }

        buildRepository.save(build);

        if (status == BuildStatus.SUCCESS) {
            eventPublisher.publishEvent(new BuildCompletedEvent(buildId, build.getApplicationId(), imageTag, true));
        } else if (status == BuildStatus.FAILED) {
            eventPublisher.publishEvent(new BuildCompletedEvent(buildId, build.getApplicationId(), null, false));
        }
    }
}
