package com.ork8stra.buildengine;

import io.fabric8.kubernetes.api.model.batch.v1.Job;
import io.fabric8.kubernetes.client.KubernetesClient;
import io.fabric8.kubernetes.client.Watch;
import io.fabric8.kubernetes.client.Watcher;
import io.fabric8.kubernetes.client.WatcherException;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class KanikoJobWatcher {

    private final KubernetesClient kubernetesClient;
    private final BuildService buildService;
    private Watch watch;

    @PostConstruct
    public void startWatching() {
        log.info("Starting Kaniko Job Watcher for ork8stra builds");
        watch = kubernetesClient.batch().v1().jobs()
                .withLabel("managed-by", "ork8stra")
                .withLabel("job-type", "build")
                .watch(new Watcher<>() {
                    @Override
                    public void eventReceived(Action action, Job job) {
                        if (action != Action.MODIFIED)
                            return;

                        var status = job.getStatus();
                        if (status == null)
                            return;

                        String buildIdStr = job.getMetadata().getAnnotations() != null
                                ? job.getMetadata().getAnnotations().get("ork8stra.com/build-id")
                                : null;

                        if (buildIdStr == null)
                            return;

                        UUID buildId = UUID.fromString(buildIdStr);

                        if (status.getSucceeded() != null && status.getSucceeded() > 0) {
                            log.info("Build Job '{}' succeeded", job.getMetadata().getName());
                            String imageTag = extractImageTag(job);
                            buildService.updateBuildStatus(buildId, BuildStatus.SUCCESS, imageTag);
                        } else if (status.getFailed() != null && status.getFailed() > 0) {
                            log.warn("Build Job '{}' failed", job.getMetadata().getName());
                            buildService.updateBuildStatus(buildId, BuildStatus.FAILED, null);
                        }
                    }

                    @Override
                    public void onClose(WatcherException e) {
                        if (e != null) {
                            log.error("Kaniko Job Watcher closed unexpectedly", e);
                        }
                    }
                });
    }

    @PreDestroy
    public void stopWatching() {
        if (watch != null) {
            watch.close();
        }
    }

    private String extractImageTag(Job job) {
        var containers = job.getSpec().getTemplate().getSpec().getContainers();
        if (containers == null || containers.isEmpty())
            return null;

        return containers.get(0).getArgs().stream()
                .filter(arg -> arg.startsWith("--destination="))
                .map(arg -> arg.replace("--destination=", ""))
                .findFirst()
                .orElse(null);
    }
}
