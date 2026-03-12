package com.ork8stra.api.controller;

import com.ork8stra.applicationmanagement.Application;
import com.ork8stra.applicationmanagement.ApplicationService;
import com.ork8stra.projectmanagement.Project;
import com.ork8stra.projectmanagement.ProjectService;
import io.fabric8.kubernetes.api.model.metrics.v1beta1.ContainerMetrics;
import io.fabric8.kubernetes.api.model.metrics.v1beta1.PodMetrics;
import io.fabric8.kubernetes.client.KubernetesClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Slf4j
@RestController
@RequestMapping("/api/v1/apps/{appId}")
@RequiredArgsConstructor
public class MetricsController {

    private final ApplicationService applicationService;
    private final ProjectService projectService;
    private final KubernetesClient kubernetesClient;
    private final ExecutorService metricsExecutor = Executors.newCachedThreadPool();

    @GetMapping(value = "/metrics", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamMetrics(@PathVariable UUID appId) {
        SseEmitter emitter = new SseEmitter(300_000L);

        metricsExecutor.execute(() -> {
            try {
                Application app = applicationService.getApplication(appId);
                Project project = projectService.getProjectById(app.getProjectId());
                String namespace = project.getK8sNamespace();
                String appName = app.getName().toLowerCase().replaceAll("[^a-z0-9]", "");

                for (int i = 0; i < 150; i++) {
                    List<PodMetrics> podMetricsList;
                    try {
                        podMetricsList = kubernetesClient.top().pods()
                                .inNamespace(namespace)
                                .metrics()
                                .getItems()
                                .stream()
                                .filter(pm -> {
                                    Map<String, String> labels = pm.getMetadata().getLabels();
                                    return labels != null && appName.equals(labels.get("app"));
                                })
                                .toList();
                    } catch (Exception e) {
                        podMetricsList = List.of();
                    }

                    long cpuNanos = 0;
                    long memBytes = 0;

                    for (PodMetrics pm : podMetricsList) {
                        for (ContainerMetrics cm : pm.getContainers()) {
                            Map<String, io.fabric8.kubernetes.api.model.Quantity> usage = cm.getUsage();
                            if (usage.containsKey("cpu")) {
                                cpuNanos += parseQuantity(usage.get("cpu").getAmount(), usage.get("cpu").getFormat());
                            }
                            if (usage.containsKey("memory")) {
                                memBytes += parseMemory(usage.get("memory").getAmount(),
                                        usage.get("memory").getFormat());
                            }
                        }
                    }

                    Map<String, Object> payload = new LinkedHashMap<>();
                    payload.put("cpuMillicores", cpuNanos / 1_000_000);
                    payload.put("memoryMiB", memBytes / (1024 * 1024));
                    payload.put("podCount", podMetricsList.size());
                    payload.put("timestamp", System.currentTimeMillis());

                    emitter.send(SseEmitter.event().name("metrics").data(payload));
                    Thread.sleep(2000);
                }
                emitter.complete();
            } catch (Exception e) {
                log.error("Metrics stream error for app '{}'", appId, e);
                emitter.completeWithError(e);
            }
        });

        return emitter;
    }

    private long parseQuantity(String amount, String format) {
        if (amount == null)
            return 0;
        try {
            if ("n".equals(format))
                return Long.parseLong(amount);
            if ("u".equals(format))
                return Long.parseLong(amount) * 1_000;
            if ("m".equals(format))
                return Long.parseLong(amount) * 1_000_000;
            return Long.parseLong(amount) * 1_000_000_000L;
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private long parseMemory(String amount, String format) {
        if (amount == null)
            return 0;
        try {
            long val = Long.parseLong(amount);
            return switch (format == null ? "" : format) {
                case "Ki" -> val * 1024;
                case "Mi" -> val * 1024 * 1024;
                case "Gi" -> val * 1024 * 1024 * 1024;
                default -> val;
            };
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}
