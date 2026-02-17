package com.ork8stra.api.controller;

import com.ork8stra.api.dto.BuildResponse;
import com.ork8stra.applicationmanagement.Application;
import com.ork8stra.applicationmanagement.ApplicationService;
import com.ork8stra.buildengine.Build;
import com.ork8stra.buildengine.BuildLogService;
import com.ork8stra.buildengine.BuildService;
import com.ork8stra.projectmanagement.Project;
import com.ork8stra.projectmanagement.ProjectService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/apps/{appId}/build")
@RequiredArgsConstructor
public class BuildController {

    private final ApplicationService applicationService;
    private final ProjectService projectService;
    private final BuildService buildService;
    private final BuildLogService buildLogService;

    @PostMapping
    public ResponseEntity<BuildResponse> triggerBuild(@PathVariable UUID appId) {
        Application app = applicationService.getApplication(appId);
        Project project = projectService.getProjectById(app.getProjectId());

        String imageTag = "ttl.sh/ork8stra-" + app.getId().toString() + ":1h";

        log.info("Triggering build for app '{}' into namespace '{}' targeting image '{}'",
                app.getName(), project.getK8sNamespace(), imageTag);

        Build build = buildService.triggerBuild(app, project, imageTag);

        return ResponseEntity.accepted().body(BuildResponse.from(build));
    }

    @GetMapping
    public ResponseEntity<List<BuildResponse>> listBuilds(@PathVariable UUID appId) {
        List<Build> builds = buildService.getBuildsForApplication(appId);
        return ResponseEntity.ok(builds.stream().map(BuildResponse::from).toList());
    }

    @GetMapping("/{buildId}")
    public ResponseEntity<BuildResponse> getBuild(@PathVariable UUID appId, @PathVariable UUID buildId) {
        Build build = buildService.getBuild(buildId);
        return ResponseEntity.ok(BuildResponse.from(build));
    }

    @GetMapping(value = "/{buildId}/logs", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamBuildLogs(@PathVariable UUID appId, @PathVariable UUID buildId) {
        return buildLogService.streamLogs(buildId);
    }
}
