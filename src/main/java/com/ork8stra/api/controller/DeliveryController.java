package com.ork8stra.api.controller;

import com.ork8stra.applicationmanagement.Application;
import com.ork8stra.applicationmanagement.ApplicationRepository;
import com.ork8stra.buildengine.Build;
import com.ork8stra.buildengine.BuildRepository;
import com.ork8stra.projectmanagement.Project;
import com.ork8stra.projectmanagement.ProjectRepository;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/delivery")
@RequiredArgsConstructor
public class DeliveryController {

    private final BuildRepository buildRepository;
    private final ApplicationRepository applicationRepository;
    private final ProjectRepository projectRepository;

    @GetMapping("/builds")
    public List<BuildInfo> getBuilds() {
        return buildRepository.findAll().stream()
                .map(this::toInfo)
                .sorted(Comparator.comparing(BuildInfo::getStartTime, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    private BuildInfo toInfo(Build b) {
        Application app = applicationRepository.findById(b.getApplicationId()).orElse(null);
        String appName = app != null ? app.getName() : "Deleted App";
        String projectName = "Unknown";
        if (app != null) {
            projectName = projectRepository.findById(app.getProjectId())
                    .map(Project::getName)
                    .orElse("Deleted Project");
        }

        return new BuildInfo(
                b.getId(),
                appName,
                projectName,
                b.getStatus().name(),
                b.getStartTime(),
                b.getEndTime(),
                b.getImageTag(),
                b.getJobName()
        );
    }

    @Data
    @AllArgsConstructor
    public static class BuildInfo {
        private UUID id;
        private String applicationName;
        private String projectName;
        private String status;
        private Instant startTime;
        private Instant endTime;
        private String imageTag;
        private String jobName;
    }
}
