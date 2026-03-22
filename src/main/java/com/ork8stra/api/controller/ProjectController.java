package com.ork8stra.api.controller;

import com.ork8stra.api.dto.CreateProjectRequest;
import com.ork8stra.api.dto.ProjectResponse;
import com.ork8stra.projectmanagement.Project;
import com.ork8stra.projectmanagement.ProjectService;
import com.ork8stra.teammanagement.TeamService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/projects")
public class ProjectController {

    private final ProjectService projectService;
    private final TeamService teamService;

    @PostMapping
    public ResponseEntity<ProjectResponse> createProject(
            @Valid @RequestBody CreateProjectRequest request) {
        log.info("Creating project '{}' under team '{}'", request.getName(), request.getTeamId());
        Project project = projectService.createProject(request.getName(), request.getTeamId());
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(project));
    }

    @GetMapping
    public ResponseEntity<List<ProjectResponse>> listProjects(@RequestParam UUID teamId) {
        List<ProjectResponse> projects = projectService.getProjectsByTeamId(teamId).stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(projects);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponse> getProject(@PathVariable UUID id) {
        Project project = projectService.getProjectById(id);
        return ResponseEntity.ok(toResponse(project));
    }

    @DeleteMapping("/{projectId}")
    @PreAuthorize("@rbacService.hasOrgRole(#orgId, 'ADMIN') or @rbacService.hasPermission(#orgId, 'project:delete')")
    public ResponseEntity<Void> deleteProject(
            @PathVariable UUID projectId,
            @RequestParam UUID orgId) {
        projectService.deleteProject(projectId);
        return ResponseEntity.noContent().build();
    }

    private ProjectResponse toResponse(Project project) {
        String teamName = "Unknown Team";
        if (project.getTeamId() != null) {
            try {
                teamName = teamService.getTeamById(project.getTeamId()).getName();
            } catch (Exception e) {
                log.warn("Could not find team for project {}: {}", project.getId(), e.getMessage());
            }
        }

        return ProjectResponse.builder()
                .id(project.getId().toString())
                .name(project.getName())
                .owner(project.getTeamId() != null ? project.getTeamId().toString() : null)
                .teamName(teamName)
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }
}
