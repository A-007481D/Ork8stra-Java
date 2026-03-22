package com.ork8stra.deploymentengine;

import com.ork8stra.api.dto.DeploymentResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class DeploymentEventService {

    private final Map<UUID, SseEmitter> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(UUID deploymentId) {
        SseEmitter emitter = new SseEmitter(600_000L); // 10 minutes
        emitters.put(deploymentId, emitter);

        emitter.onCompletion(() -> emitters.remove(deploymentId));
        emitter.onTimeout(() -> emitters.remove(deploymentId));
        emitter.onError((e) -> emitters.remove(deploymentId));

        return emitter;
    }

    public void broadcastUpdate(Deployment deployment) {
        SseEmitter emitter = emitters.get(deployment.getId());
        if (emitter != null) {
            try {
                DeploymentResponse response = DeploymentResponse.from(deployment);
                emitter.send(SseEmitter.event()
                        .name("pipeline-update")
                        .data(response)
                        .id(UUID.randomUUID().toString()));
            } catch (IOException e) {
                log.warn("Failed to send SSE update for deployment {}: {}", deployment.getId(), e.getMessage());
                emitters.remove(deployment.getId());
            }
        }
    }
}
