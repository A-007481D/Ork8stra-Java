package com.ork8stra.buildengine;

import com.ork8stra.applicationmanagement.Application;
import com.ork8stra.deploymentengine.KanikoJobFactory;
import com.ork8stra.infrastructure.messaging.EventPublisher;
import com.ork8stra.projectmanagement.Project;
import io.fabric8.kubernetes.api.model.batch.v1.Job;
import io.fabric8.kubernetes.client.KubernetesClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class BuildService {

    private final BuildRepository buildRepository;
    private final KubernetesClient kubernetesClient;
    private final KanikoJobFactory kanikoJobFactory;
    private final ApplicationEventPublisher applicationEventPublisher;
    private final EventPublisher eventPublisher;

    @Transactional
    public Build triggerBuild(Application app, Project project, String imageDestination) {
        Build build = new Build(app.getId(), "HEAD");
        build.setStatus(BuildStatus.RUNNING);
        build.setImageTag(imageDestination);

        Job job = kanikoJobFactory.createKanikoJob(app, project, imageDestination, build.getId());
        String jobName = job.getMetadata().getName();
        build.setJobName(jobName);

        kubernetesClient.batch().v1().jobs()
                .inNamespace(project.getK8sNamespace())
                .resource(job)
                .create();

        log.info("Dispatched Kaniko job '{}' in namespace '{}'", jobName, project.getK8sNamespace());
        Build saved = buildRepository.save(build);

        eventPublisher.publishBuildStatus(saved.getId().toString(), "RUNNING", imageDestination);

        return saved;
    }

    @Transactional
    public void updateBuildStatus(UUID buildId, BuildStatus status, String imageTag) {
        Build build = buildRepository.findById(buildId)
                .orElseThrow(() -> new IllegalArgumentException("Build not found: " + buildId));

        build.setStatus(status);
        if (imageTag != null) {
            build.setImageTag(imageTag);
        }
        if (status == BuildStatus.SUCCESS || status == BuildStatus.FAILED) {
            build.setEndTime(Instant.now());
        }

        buildRepository.save(build);

        eventPublisher.publishBuildStatus(buildId.toString(), status.name(), imageTag);

        if (status == BuildStatus.SUCCESS) {
            applicationEventPublisher
                    .publishEvent(new BuildCompletedEvent(buildId, build.getApplicationId(), imageTag, true));
        } else if (status == BuildStatus.FAILED) {
            applicationEventPublisher
                    .publishEvent(new BuildCompletedEvent(buildId, build.getApplicationId(), null, false));
        }
    }

    public List<Build> getBuildsForApplication(UUID applicationId) {
        return buildRepository.findByApplicationId(applicationId);
    }

    public Build getBuild(UUID buildId) {
        return buildRepository.findById(buildId)
                .orElseThrow(() -> new IllegalArgumentException("Build not found: " + buildId));
    }
}
