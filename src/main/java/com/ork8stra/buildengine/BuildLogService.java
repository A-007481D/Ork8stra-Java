package com.ork8stra.buildengine;

import io.fabric8.kubernetes.api.model.Pod;
import io.fabric8.kubernetes.client.KubernetesClient;
import io.fabric8.kubernetes.client.dsl.LogWatch;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BuildLogService {

    private final KubernetesClient kubernetesClient;
    private final BuildService buildService;
    private final ExecutorService logExecutor = Executors.newCachedThreadPool();

    public SseEmitter streamLogs(UUID buildId) {
        Build build = buildService.getBuild(buildId);
        SseEmitter emitter = new SseEmitter(300_000L);

        String jobName = build.getJobName();
        if (jobName == null) {
            throw new IllegalStateException("Build has no associated Kubernetes Job");
        }

        logExecutor.execute(() -> {
            try {
                List<Pod> pods = List.of();
                for (int attempt = 0; attempt < 30; attempt++) {
                    pods = kubernetesClient.pods()
                            .inAnyNamespace()
                            .withLabel("job-name", jobName)
                            .list()
                            .getItems();

                    if (!pods.isEmpty())
                        break;

                    log.debug("Waiting for pod for job '{}' (attempt {}/30)", jobName, attempt + 1);
                    emitter.send(SseEmitter.event().name("log").data("Waiting for build pod to start..."));
                    Thread.sleep(1000);
                }

                if (pods.isEmpty()) {
                    emitter.send(SseEmitter.event()
                            .name("error")
                            .data("No pods found for build job: " + jobName));
                    emitter.complete();
                    return;
                }

                String podName = pods.get(0).getMetadata().getName();
                String namespace = pods.get(0).getMetadata().getNamespace();

                // Wait for the 'kaniko' container to be ready or terminated
                for (int attempt = 0; attempt < 60; attempt++) {
                    Pod currentPod = kubernetesClient.pods().inNamespace(namespace).withName(podName).get();
                    if (currentPod == null) break;

                    var containerStatus = currentPod.getStatus().getContainerStatuses().stream()
                            .filter(cs -> cs.getName().equals("kaniko"))
                            .findFirst()
                            .orElse(null);

                    if (containerStatus != null && (containerStatus.getState().getRunning() != null || containerStatus.getState().getTerminated() != null)) {
                        break;
                    }

                    // Also check if an init container failed
                    var initStatus = currentPod.getStatus().getInitContainerStatuses().stream()
                            .filter(cs -> cs.getState().getTerminated() != null && cs.getState().getTerminated().getExitCode() != 0)
                            .findFirst()
                            .orElse(null);

                    if (initStatus != null) {
                        emitter.send(SseEmitter.event().name("log").data("Init container '" + initStatus.getName() + "' failed with exit code " + initStatus.getState().getTerminated().getExitCode()));
                        emitter.send(SseEmitter.event().name("error").data("Initialization failed"));
                        emitter.complete();
                        return;
                    }

                    log.debug("Waiting for kaniko container to start (attempt {}/60)", attempt + 1);
                    emitter.send(SseEmitter.event().name("log").data("Waiting for build container to start..."));
                    Thread.sleep(2000);
                }

                log.info("Streaming logs for pod '{}' in namespace '{}'", podName, namespace);

                try (LogWatch logWatch = kubernetesClient.pods()
                        .inNamespace(namespace)
                        .withName(podName)
                        .inContainer("kaniko")
                        .tailingLines(100)
                        .watchLog()) {

                    BufferedReader reader = new BufferedReader(
                            new InputStreamReader(logWatch.getOutput()));

                    String line;
                    while ((line = reader.readLine()) != null) {
                        emitter.send(SseEmitter.event()
                                .name("log")
                                .data(line));
                    }

                    emitter.send(SseEmitter.event()
                            .name("complete")
                            .data("Build log stream ended"));
                    emitter.complete();
                }
            } catch (Exception e) {
                log.error("Error streaming build logs for build '{}'", buildId, e);
                try {
                    emitter.send(SseEmitter.event()
                            .name("error")
                            .data("Log streaming error: " + e.getMessage()));
                } catch (Exception ignored) {
                }
                emitter.completeWithError(e);
            }
        });

        return emitter;
    }
}
