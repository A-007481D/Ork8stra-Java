package com.ork8stra.api.dto;

import com.ork8stra.deploymentengine.Deployment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeploymentResponse {
    private UUID id;
    private UUID applicationId;
    private String imageTag;
    private int replicas;
    private String status;
    private String liveUrl;
    private Instant deployedAt;
    private List<StageResponse> stages;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StageResponse {
        private UUID id;
        private String name;
        private String status;
        private Instant startTime;
        private Instant endTime;
        private Long estimatedDuration;
        private List<StepResponse> steps;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StepResponse {
        private UUID id;
        private String name;
        private String status;
        private String logSnippet;
        private Instant timestamp;
    }

    public static DeploymentResponse from(Deployment deployment) {
        return DeploymentResponse.builder()
                .id(deployment.getId())
                .applicationId(deployment.getApplicationId())
                .imageTag(deployment.getVersion())
                .replicas(deployment.getReplicas())
                .status(deployment.getStatus() != null ? deployment.getStatus().name() : "UNKNOWN")
                .liveUrl(deployment.getIngressUrl())
                .deployedAt(deployment.getDeployedAt())
                .stages(deployment.getStages() != null ? deployment.getStages().stream()
                        .map(DeploymentResponse::mapStage)
                        .collect(Collectors.toList()) : List.of())
                .build();
    }

    private static StageResponse mapStage(com.ork8stra.deploymentengine.DeploymentStage s) {
        return StageResponse.builder()
                .id(s.getId())
                .name(s.getName())
                .status(s.getStatus() != null ? s.getStatus().name() : "PENDING")
                .startTime(s.getStartTime())
                .endTime(s.getEndTime())
                .estimatedDuration(s.getEstimatedDuration())
                .steps(s.getSteps() != null ? s.getSteps().stream()
                        .map(DeploymentResponse::mapStep)
                        .collect(Collectors.toList()) : List.of())
                .build();
    }

    private static StepResponse mapStep(com.ork8stra.deploymentengine.DeploymentStep step) {
        return StepResponse.builder()
                .id(step.getId())
                .name(step.getName())
                .status(step.getStatus() != null ? step.getStatus().name() : "PENDING")
                .logSnippet(step.getLogSnippet())
                .timestamp(step.getTimestamp())
                .build();
    }
}
