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
        SseEmitter emitter = new SseEmitter(900_000L); // 15 minutes timeout for heavy Nixpacks builds

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

                    emitter.send(SseEmitter.event().name("log").data("Waiting for build pod to start..."));
                    Thread.sleep(1000);
                }

                if (pods.isEmpty()) {
                    emitter.send(SseEmitter.event().name("error").data("No pods found for build job: " + jobName));
                    emitter.complete();
                    return;
                }

                Pod pod = pods.get(0);
                String podName = pod.getMetadata().getName();
                String namespace = pod.getMetadata().getNamespace();

                List<String> containers = List.of("git-clone", "dockerfile-auto-detect", "kaniko");

                for (String containerName : containers) {
                    // Check if container exists in pod spec
                    boolean exists = pod.getSpec().getInitContainers().stream().anyMatch(c -> c.getName().equals(containerName)) ||
                                     pod.getSpec().getContainers().stream().anyMatch(c -> c.getName().equals(containerName));
                    
                    if (!exists) continue;

                    emitter.send(SseEmitter.event().name("log").data("\n--- Stage: " + containerName + " ---"));

                    // Wait for container to be ready to stream
                    boolean started = false;
                    for (int attempt = 0; attempt < 300; attempt++) { // Wait up to 10 mins total for container start
                        Pod currentPod = kubernetesClient.pods().inNamespace(namespace).withName(podName).get();
                        if (currentPod == null) break;

                        var status = currentPod.getStatus().getInitContainerStatuses().stream()
                                .filter(cs -> cs.getName().equals(containerName))
                                .findFirst()
                                .orElse(null);
                        
                        if (status == null) {
                            status = currentPod.getStatus().getContainerStatuses().stream()
                                    .filter(cs -> cs.getName().equals(containerName))
                                    .findFirst()
                                    .orElse(null);
                        }

                        if (status != null) {
                            if (status.getState().getTerminated() != null) {
                                if (status.getState().getTerminated().getExitCode() != 0) {
                                    emitter.send(SseEmitter.event().name("error").data("Stage '" + containerName + "' failed with exit code " + status.getState().getTerminated().getExitCode()));
                                    emitter.complete();
                                    return;
                                }
                                started = true; // Was successful, but already finished
                                break;
                            }
                            if (status.getState().getRunning() != null) {
                                started = true;
                                break;
                            }
                        }
                        
                        if (attempt % 5 == 0) {
                            emitter.send(SseEmitter.event().name("log").data("Waiting for " + containerName + " to start..."));
                        }
                        Thread.sleep(2000);
                    }

                    if (!started) {
                        emitter.send(SseEmitter.event().name("log").data("Skipping logs for " + containerName + " (timed out or not started)"));
                        continue;
                    }

                    try (LogWatch logWatch = kubernetesClient.pods()
                            .inNamespace(namespace)
                            .withName(podName)
                            .inContainer(containerName)
                            .watchLog()) {

                        BufferedReader reader = new BufferedReader(new InputStreamReader(logWatch.getOutput()));
                        String line;
                        while ((line = reader.readLine()) != null) {
                            emitter.send(SseEmitter.event().name("log").data(line));
                        }
                    } catch (Exception e) {
                        log.warn("Error streaming logs for container {}: {}", containerName, e.getMessage());
                    }
                }

                emitter.send(SseEmitter.event().name("complete").data("Build log stream ended"));
                emitter.complete();

            } catch (Exception e) {
                log.error("Error streaming build logs for build '{}'", buildId, e);
                try {
                    String errorMsg = e.getMessage() != null ? e.getMessage() : "Internal server error while streaming logs";
                    emitter.send(SseEmitter.event().name("error").data("Log streaming error: " + errorMsg));
                } catch (Exception ignored) {}
                emitter.completeWithError(e);
            }
        });

        return emitter;
    }
}
