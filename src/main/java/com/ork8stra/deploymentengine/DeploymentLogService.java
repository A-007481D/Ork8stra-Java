package com.ork8stra.deploymentengine;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DeploymentLogService {

    private final DeploymentRepository deploymentRepository;
    private final ExecutorService logExecutor = Executors.newCachedThreadPool();

    public SseEmitter streamDeploymentLogs(UUID deploymentId, String stageId) {
        Deployment deployment = deploymentRepository.findById(deploymentId)
                .orElseThrow(() -> new IllegalArgumentException("Deployment not found: " + deploymentId));
        
        SseEmitter emitter = new SseEmitter(600_000L); // 10 minutes

        logExecutor.execute(() -> {
            try {
                // If a stageId is provided, we filter logs only for that stage.
                // For now, mapping simplified: stageId corresponds to a stage name in our initialized list.
                
                List<DeploymentStage> stagesToStream = deployment.getStages();
                if (stageId != null && !stageId.isEmpty()) {
                    stagesToStream = stagesToStream.stream()
                            .filter(s -> s.getId().toString().equals(stageId) || s.getName().equalsIgnoreCase(stageId))
                            .toList();
                }

                for (DeploymentStage stage : stagesToStream) {
                    emitter.send(SseEmitter.event().name("log").data("\n--- Stage: " + stage.getName() + " ---"));
                    
                    // Mocking technical output for Build/Test stages for the demo
                    if (stage.getName().equals("Build") || stage.getName().equals("Test")) {
                        for (DeploymentStep step : stage.getSteps()) {
                            emitter.send(SseEmitter.event().name("log").data("[" + stage.getName() + "] Executing " + step.getName() + "..."));
                            Thread.sleep(100);
                            emitter.send(SseEmitter.event().name("log").data("[" + stage.getName() + "] " + step.getName() + " completed successfully."));
                        }
                    } else if (stage.getName().equals("Deploy")) {
                        // Stream actual K8s logs if status is healthy? 
                        // For simplicity in this visualization, we'll keep the technical flow clear:
                        emitter.send(SseEmitter.event().name("log").data("[Deploy] Initializing K8s resources..."));
                        emitter.send(SseEmitter.event().name("log").data("[Deploy] Namespace: " + deployment.getApplicationId()));
                        emitter.send(SseEmitter.event().name("log").data("[Deploy] Applying Deployment resource..."));
                        emitter.send(SseEmitter.event().name("log").data("[Deploy] Application is now LIVE at: " + deployment.getIngressUrl()));
                    }
                }

                emitter.send(SseEmitter.event().name("complete").data("Log stream completed."));
                emitter.complete();

            } catch (Exception e) {
                log.error("Error streaming logs for deployment {}", deploymentId, e);
                try {
                    emitter.send(SseEmitter.event().name("error").data("Log stream error: " + e.getMessage()));
                } catch (Exception ignored) {}
                emitter.completeWithError(e);
            }
        });

        return emitter;
    }
}
