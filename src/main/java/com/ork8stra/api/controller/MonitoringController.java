package com.ork8stra.api.controller;

import com.ork8stra.applicationmanagement.Application;
import com.ork8stra.applicationmanagement.ApplicationService;
import com.ork8stra.deploymentengine.MetricsService;
import com.ork8stra.deploymentengine.MetricsSnapshotService;
import com.ork8stra.deploymentengine.TrafficMetricsService;
import com.ork8stra.projectmanagement.Project;
import com.ork8stra.projectmanagement.ProjectService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/apps")
@RequiredArgsConstructor
public class MonitoringController {

    private final MetricsService metricsService;
    private final com.ork8stra.deploymentengine.ProjectEventService projectEventService;
    private final ApplicationService applicationService;
    private final ProjectService projectService;
    private final MetricsSnapshotService metricsSnapshotService;
    private final TrafficMetricsService trafficMetricsService;

    @GetMapping("/{id}/metrics")
    public ResponseEntity<MetricsService.AppMetrics> getAppMetrics(@PathVariable UUID id) {
        Application app = applicationService.getApplication(id);
        Project project = projectService.getProjectById(app.getProjectId());

        String namespace = project.getK8sNamespace();
        String resourceName = toKubernetesName(app.getName());

        MetricsService.AppMetrics stats = metricsService.getApplicationMetrics(namespace, resourceName);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/projects/{projectId}/metrics")
    public ResponseEntity<MetricsService.ProjectMetrics> getProjectMetrics(@PathVariable UUID projectId) {
        Project project = projectService.getProjectById(projectId);
        java.util.List<Application> apps = applicationService.getApplicationsByProject(projectId);

        MetricsService.ProjectMetrics stats = metricsService.getProjectMetrics(projectId, apps,
                project.getK8sNamespace());
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/projects/{projectId}/events")
    public ResponseEntity<java.util.List<com.ork8stra.deploymentengine.ProjectEventService.K8sEvent>> getProjectEvents(
            @PathVariable UUID projectId) {
        Project project = projectService.getProjectById(projectId);
        return ResponseEntity.ok(projectEventService.getRecentEvents(project.getK8sNamespace()));
    }

    @GetMapping("/projects/{projectId}/sparklines")
    public ResponseEntity<java.util.Map<UUID, java.util.List<MetricsService.AppSummaryMetrics>>> getProjectSparklines(@PathVariable UUID projectId) {
        java.util.List<Application> apps = applicationService.getApplicationsByProject(projectId);
        java.util.Map<UUID, java.util.List<MetricsService.AppSummaryMetrics>> result = new java.util.HashMap<>();
        for (Application app : apps) {
            result.put(app.getId(), metricsSnapshotService.getAppHistory(app.getId()));
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/projects/{projectId}/traffic")
    public ResponseEntity<java.util.Map<UUID, TrafficMetricsService.TrafficStats>> getProjectTraffic(@PathVariable UUID projectId) {
        java.util.List<Application> apps = applicationService.getApplicationsByProject(projectId);
        java.util.Map<UUID, TrafficMetricsService.TrafficStats> result = new java.util.HashMap<>();
        for (Application app : apps) {
            result.put(app.getId(), trafficMetricsService.getTrafficMetrics(app.getId()));
        }
        return ResponseEntity.ok(result);
    }

    private String toKubernetesName(String rawName) {
        String normalized = rawName.toLowerCase().replaceAll("[^a-z0-9-]", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
        return normalized.isBlank() ? "app" : normalized;
    }
}
