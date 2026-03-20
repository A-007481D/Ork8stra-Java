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
import org.springframework.beans.factory.annotation.Value;
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

    @Value("${kubelite.image.repository:ttl.sh}")
    private String imageRepository;

    @Value("${kubelite.image.ttl:24h}")
    private String ttlShTagTtl;

    @PostMapping
    public ResponseEntity<BuildResponse> triggerBuild(@PathVariable UUID appId) {
        Application app = applicationService.getApplication(appId);
        Project project = projectService.getProjectById(app.getProjectId());

        String imageTag = resolveImageTag(app);

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

    private String resolveImageTag(Application app) {
        String normalizedRepo = imageRepository;
        
        // Dynamic discovery: if repository is null, empty, or "AUTO", try to find local-registry service
        if (normalizedRepo == null || normalizedRepo.isEmpty() || "AUTO".equalsIgnoreCase(normalizedRepo)) {
            try {
                // Try standard Minikube locations
                var svc = projectService.getKubernetesClient().services().inNamespace("kube-system").withName("local-registry").get();
                if (svc == null) {
                    svc = projectService.getKubernetesClient().services().inNamespace("kube-system").withName("registry").get();
                }
                if (svc == null) {
                    svc = projectService.getKubernetesClient().services().inNamespace("container-registry").withName("local-registry").get();
                }
                
                if (svc != null && svc.getSpec() != null && svc.getSpec().getClusterIP() != null) {
                    int port = 5000;
                    if (svc.getSpec().getPorts() != null && !svc.getSpec().getPorts().isEmpty()) {
                        port = svc.getSpec().getPorts().get(0).getPort();
                    }
                    normalizedRepo = svc.getSpec().getClusterIP() + ":" + port; 
                    log.info("Dynamically discovered local registry at {} (using port {})", normalizedRepo, port);
                } else {
                    normalizedRepo = "ttl.sh";
                }
            } catch (Exception e) {
                log.warn("Failed to discover local registry, falling back to ttl.sh: {}", e.getMessage());
                normalizedRepo = "ttl.sh";
            }
        }

        String appRef = "ork8stra-" + app.getId();

        if ("ttl.sh".equalsIgnoreCase(normalizedRepo)) {
            return "ttl.sh/" + appRef + ":" + ttlShTagTtl;
        }

        String repoPrefix = normalizedRepo.endsWith("/")
                ? normalizedRepo.substring(0, normalizedRepo.length() - 1)
                : normalizedRepo;
        return repoPrefix + "/" + appRef + ":latest";
    }
}
