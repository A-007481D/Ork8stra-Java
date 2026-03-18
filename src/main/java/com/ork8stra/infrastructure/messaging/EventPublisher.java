package com.ork8stra.infrastructure.messaging;

import java.util.Map;

public interface EventPublisher {
    void publishEvent(String exchange, String routingKey, Object event);

    void publishBuildTrigger(String projectId, String commitHash, Map<String, String> context);

    void publishBuildStatus(String buildId, String status, String imageTag);

    void publishDeploymentStatus(String deploymentId, String applicationId, String status, String url);
}
