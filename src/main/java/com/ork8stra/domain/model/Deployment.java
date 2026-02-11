package com.ork8stra.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;


@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Deployment {
    private String id;
    private String projectId;
    private String buildId;
    private String imageTag;

    private Integer internal_port;
    private String service_url;
    private Map<String, String> env;

    private Integer replicas;
    private String cpu_limit;
    private String memory_limit;

    private Instant last_health_check;
    private Instant deployed_at;
    private DeploymentStatus status;




    public enum DeploymentStatus {
        SUCCESS,
        FAILED,
        DEPLOYING,
        STOPPED,
        RUNNING,
        PENDING
    }
}

