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

        // Reconcile any builds that completed while the backend was down
        reconcileOnStartup();

        try {
            var batch = kubernetesClient.batch();
            if (batch == null) return;
            var v1 = batch.v1();
            if (v1 == null) return;
            var jobs = v1.jobs();
            if (jobs == null) return;
            
            watch = jobs.inAnyNamespace()
                    .withLabel("managed-by", "ork8stra")
                    .withLabel("job-type", "build")
                    .watch(new Watcher<>() {
                        @Override
                        public void eventReceived(Action action, Job job) {
                            if (action != Action.MODIFIED && action != Action.ADDED) {
                                return;
                            }

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
                                updateIfRunning(buildId, BuildStatus.SUCCESS, imageTag);
                            } else if (status.getFailed() != null && status.getFailed() > 0) {
                                log.warn("Build Job '{}' failed", job.getMetadata().getName());
                                updateIfRunning(buildId, BuildStatus.FAILED, null);
                            }
                        }

                        @Override
                        public void onClose(WatcherException e) {
                            if (e != null) {
                                log.error("Kaniko Job Watcher closed unexpectedly", e);
                            }
                        }
                    });
        } catch (Exception e) {
            log.warn("Could not start Kaniko Job Watcher (cluster may be unreachable): {}", e.getMessage());
        }
    }

    private void reconcileOnStartup() {
        log.info("Reconciling missed build events...");
        try {
            var jobs = kubernetesClient.batch().v1().jobs()
                    .inAnyNamespace()
                    .withLabel("managed-by", "ork8stra")
                    .withLabel("job-type", "build")
                    .list()
                    .getItems();

            for (Job job : jobs) {
                var status = job.getStatus();
                if (status == null) continue;

                String buildIdStr = job.getMetadata().getAnnotations() != null
                        ? job.getMetadata().getAnnotations().get("ork8stra.com/build-id")
                        : null;
                if (buildIdStr == null) continue;

                UUID buildId = UUID.fromString(buildIdStr);

                try {
                    Build build = buildService.getBuild(buildId);
                    if (build.getStatus() != BuildStatus.RUNNING) continue;

                    if (status.getSucceeded() != null && status.getSucceeded() > 0) {
                        log.info("Reconciling: Build '{}' completed while offline", buildIdStr);
                        String imageTag = extractImageTag(job);
                        buildService.updateBuildStatus(buildId, BuildStatus.SUCCESS, imageTag);
                    } else if (status.getFailed() != null && status.getFailed() > 0) {
                        log.info("Reconciling: Build '{}' failed while offline", buildIdStr);
                        buildService.updateBuildStatus(buildId, BuildStatus.FAILED, null);
                    }
                } catch (Exception e) {
                    log.warn("Skipping reconciliation for build '{}': {}", buildIdStr, e.getMessage());
                }
            }
            log.info("Build reconciliation complete.");
        } catch (Exception e) {
            log.error("Failed to reconcile builds on startup", e);
        }
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

    private void updateIfRunning(UUID buildId, BuildStatus status, String imageTag) {
        try {
            Build build = buildService.getBuild(buildId);
            if (build.getStatus() != BuildStatus.RUNNING) {
                return;
            }
            buildService.updateBuildStatus(buildId, status, imageTag);
        } catch (Exception e) {
            log.warn("Skipping watcher update for build '{}': {}", buildId, e.getMessage());
        }
    }
}
