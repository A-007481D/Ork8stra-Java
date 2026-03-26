package com.ork8stra.deploymentengine;

import com.ork8stra.applicationmanagement.Application;
import com.ork8stra.applicationmanagement.ApplicationRepository;
import com.ork8stra.projectmanagement.Project;
import com.ork8stra.projectmanagement.ProjectService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DeploymentStartupReconciler {

    private final ApplicationRepository applicationRepository;
    private final DeploymentRepository deploymentRepository;
    private final ProjectService projectService;
    private final DeploymentService deploymentService;

    @EventListener(ApplicationReadyEvent.class)
    public void reconcile() {
        for (Application app : applicationRepository.findAll()) {
            deploymentRepository.findFirstByApplicationIdOrderByDeployedAtDesc(app.getId())
                    .ifPresent(latest -> reconcileSingle(app, latest));
        }
    }

        private void reconcileSingle(Application app, Deployment latest) {
        try {
            Project project = projectService.getProjectById(app.getProjectId());
            deploymentService.reconcileLatestDeployment(app, project, latest);
        } catch (Exception ex) {
            log.warn("Failed to reconcile app '{}' on startup: {}", app.getName(), ex.getMessage());
            // Do NOT blindly set UNHEALTHY anymore. Let it stay in its last known state or wait for Watcher.
        }
    }
}

