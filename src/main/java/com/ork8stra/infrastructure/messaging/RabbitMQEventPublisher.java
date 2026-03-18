package com.ork8stra.infrastructure.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ork8stra.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class RabbitMQEventPublisher implements EventPublisher {

    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;

    @Override
    public void publishEvent(String exchange, String routingKey, Object event) {
        try {
            String json = objectMapper.writeValueAsString(event);
            rabbitTemplate.convertAndSend(exchange, routingKey, json);
            log.info("Published event to '{}/{}': {}", exchange, routingKey, json);
        } catch (Exception e) {
            log.error("Failed to publish event to '{}/{}'", exchange, routingKey, e);
            throw new RuntimeException("Event publication failed", e);
        }
    }

    @Override
    public void publishBuildTrigger(String projectId, String commitHash, Map<String, String> context) {
        record BuildTriggerEvent(String projectId, String commitHash, Map<String, String> context) {
        }
        publishEvent(RabbitMQConfig.EXCHANGE_BUILDS, RabbitMQConfig.ROUTING_KEY_TRIGGER,
                new BuildTriggerEvent(projectId, commitHash, context));
    }

    @Override
    public void publishBuildStatus(String buildId, String status, String imageTag) {
        record BuildStatusEvent(String buildId, String status, String imageTag) {
        }
        publishEvent(RabbitMQConfig.EXCHANGE_BUILDS, RabbitMQConfig.ROUTING_KEY_BUILD_STATUS,
                new BuildStatusEvent(buildId, status, imageTag));
    }

    @Override
    public void publishDeploymentStatus(String deploymentId, String applicationId, String status, String url) {
        record DeploymentStatusEvent(String deploymentId, String applicationId, String status, String url) {
        }
        publishEvent(RabbitMQConfig.EXCHANGE_DEPLOYMENTS, RabbitMQConfig.ROUTING_KEY_DEPLOY_STATUS,
                new DeploymentStatusEvent(deploymentId, applicationId, status, url));
    }
}
