package com.ork8stra.api.controller;

import com.ork8stra.applicationmanagement.Application;
import com.ork8stra.applicationmanagement.ApplicationService;
import com.ork8stra.deploymentengine.DeploymentService;
import com.ork8stra.projectmanagement.Project;
import com.ork8stra.projectmanagement.ProjectService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/apps/{appId}/build")
@RequiredArgsConstructor
public class BuildController {

    private final ApplicationService applicationService;
    private final ProjectService projectService;
    private final DeploymentService deploymentService;

    @PostMapping
    public ResponseEntity<String> triggerBuild(@PathVariable UUID appId) {
        Application app = applicationService.getApplication(appId);
        Project project = projectService.getProjectById(app.getProjectId());

        String imageTag = "ttl.sh/ork8stra-" + app.getId().toString() + ":1h";

        log.info("Triggering build for app '{}' into namespace '{}' targeting image '{}'",
                app.getName(), project.getK8sNamespace(), imageTag);

        deploymentService.triggerBuild(app, project, imageTag);

        return ResponseEntity.accepted().body("Build engine job started: " + imageTag);
    }
}
