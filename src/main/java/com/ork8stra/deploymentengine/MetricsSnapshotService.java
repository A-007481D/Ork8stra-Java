package com.ork8stra.deploymentengine;

import com.ork8stra.applicationmanagement.Application;
import com.ork8stra.applicationmanagement.ApplicationService;
import com.ork8stra.projectmanagement.Project;
import com.ork8stra.projectmanagement.ProjectService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class MetricsSnapshotService {

    private final ApplicationService applicationService;
    private final ProjectService projectService;
    private final MetricsService metricsService;

    // App ID -> List of snapshots
    private final Map<UUID, List<MetricsService.AppSummaryMetrics>> appHistory = new ConcurrentHashMap<>();

    // Run every 10 minutes
    @Scheduled(fixedRate = 600000)
    public void takeSnapshots() {
        log.info("Taking scheduled metrics snapshots...");
        for (Project project : projectService.getAllProjects()) {
            try {
                List<Application> apps = applicationService.getApplicationsByProject(project.getId());
                if (apps.isEmpty()) continue;

                MetricsService.ProjectMetrics pm = metricsService.getProjectMetrics(project.getId(), apps, project.getK8sNamespace());
                String now = Instant.now().toString();

                for (MetricsService.AppSummaryMetrics am : pm.getAppBreakdown()) {
                    am.setTimestamp(now);
                    appHistory.computeIfAbsent(am.getAppId(), k -> new ArrayList<>()).add(am);

                    // Keep last 144 records (24 hours at 10m intervals)
                    if (appHistory.get(am.getAppId()).size() > 144) {
                        appHistory.get(am.getAppId()).remove(0);
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to take metrics snapshot for project {}", project.getId(), e);
            }
        }
    }

    public List<MetricsService.AppSummaryMetrics> getAppHistory(UUID appId) {
        return appHistory.getOrDefault(appId, new ArrayList<>());
    }
}
