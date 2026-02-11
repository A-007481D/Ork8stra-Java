package com.ork8stra.infrastructure.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
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

    public static final String EXCHANGE_BUILDS = "ork8stra.builds";
    public static final String ROUTING_KEY_TRIGGER = "build.trigger";

    @Override
    public void publishEvent(String exchange, String routingKey, Object event) {
        try {
            String json = objectMapper.writeValueAsString(event);
            rabbitTemplate.convertAndSend(exchange, routingKey, json);
            log.info("Published event to swap '{}/{}': {}", exchange, routingKey, json);
        } catch (Exception e) {
            log.error("Failed to publish event", e);
            throw new RuntimeException("Event publication failed", e);
        }
    }

    @Override
    public void publishBuildTrigger(String projectId, String commitHash, Map<String, String> context) {
        BuildTriggerEvent event = new BuildTriggerEvent(projectId, commitHash, context);
        publishEvent(EXCHANGE_BUILDS, ROUTING_KEY_TRIGGER, event);
    }

    record BuildTriggerEvent(String projectId, String commitHash, Map<String, String> context) {
    }
}
