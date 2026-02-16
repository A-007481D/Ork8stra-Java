package com.ork8stra.api.dto;

import com.ork8stra.deploymentengine.Deployment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

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
    private Instant deployedAt;

    public static DeploymentResponse from(Deployment deployment) {
        return DeploymentResponse.builder()
                .id(deployment.getId())
                .applicationId(deployment.getApplicationId())
                .imageTag(deployment.getVersion())
                .replicas(deployment.getReplicas())
                .status(deployment.getStatus().name())
                .deployedAt(deployment.getDeployedAt())
                .build();
    }
}
