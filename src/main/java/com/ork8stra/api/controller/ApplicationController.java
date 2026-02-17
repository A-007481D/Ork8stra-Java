package com.ork8stra.api.controller;

import com.ork8stra.api.dto.ApplicationResponse;
import com.ork8stra.api.dto.CreateApplicationRequest;
import com.ork8stra.applicationmanagement.Application;
import com.ork8stra.applicationmanagement.ApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1")
public class ApplicationController {

    private final ApplicationService applicationService;

    @PostMapping("/projects/{projectId}/apps")
    public ResponseEntity<ApplicationResponse> createApplication(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateApplicationRequest request) {
        log.info("Creating application '{}' in project '{}'", request.getName(), projectId);

        Application app = applicationService.createApplication(
                request.getName(),
                projectId,
                request.getGitRepoUrl(),
                request.getBuildBranch(),
                request.getEnvVars());

        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(app));
    }

    @GetMapping("/projects/{projectId}/apps")
    public ResponseEntity<List<ApplicationResponse>> listApplicationsByProject(@PathVariable UUID projectId) {
        List<ApplicationResponse> apps = applicationService.getApplicationsByProject(projectId).stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(apps);
    }

    @GetMapping("/apps/{id}")
    public ResponseEntity<ApplicationResponse> getApplication(@PathVariable UUID id) {
        Application app = applicationService.getApplication(id);
        return ResponseEntity.ok(toResponse(app));
    }

    @PutMapping("/apps/{id}")
    public ResponseEntity<ApplicationResponse> updateApplication(
            @PathVariable UUID id,
            @RequestBody com.ork8stra.api.dto.UpdateApplicationRequest request) {
        Application updated = applicationService.updateApplication(
                id, request.getGitRepoUrl(), request.getBuildBranch(), request.getEnvVars());
        return ResponseEntity.ok(toResponse(updated));
    }

    @DeleteMapping("/apps/{id}")
    public ResponseEntity<Void> deleteApplication(@PathVariable UUID id) {
        applicationService.deleteApplication(id);
        return ResponseEntity.noContent().build();
    }

    private ApplicationResponse toResponse(Application app) {
        return ApplicationResponse.builder()
                .id(app.getId())
                .name(app.getName())
                .projectId(app.getProjectId())
                .gitRepoUrl(app.getGitRepoUrl())
                .buildBranch(app.getBuildBranch())
                .envVars(app.getEnvVars())
                .build();
    }
}
