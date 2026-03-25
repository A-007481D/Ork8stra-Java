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
    private final DeploymentEventService deploymentEventService;
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
                    // Update stage to RUNNING
                    stage.setStatus(DeploymentStage.PipelineStatus.RUNNING);
                    stage.setStartTime(java.time.Instant.now());
                    deploymentRepository.saveAndFlush(deployment);
                    deploymentEventService.broadcastUpdate(deployment);

                    emitter.send(SseEmitter.event().data("\n--- Stage: " + stage.getName() + " ---"));
                    
                    // Mocking technical output for specific stages
                    if (stage.getName().equals("Source Compilation")) {
                        for (DeploymentStep step : stage.getSteps()) {
                            step.setStatus(DeploymentStage.PipelineStatus.RUNNING);
                            deploymentEventService.broadcastUpdate(deployment);
                            emitter.send(SseEmitter.event().data("[" + stage.getName() + "] Executing " + step.getName() + "..."));
                            Thread.sleep(2000); 
                            step.setStatus(DeploymentStage.PipelineStatus.SUCCESS);
                        }
                        emitter.send(SseEmitter.event().data("[Source Compilation] Maven build successful. Image pushed to registry."));
                        Thread.sleep(1000);
                    } else if (stage.getName().equals("Security & Quality")) {
                        emitter.send(SseEmitter.event().data("[Security & Quality] Running static analysis..."));
                        Thread.sleep(5000);
                        emitter.send(SseEmitter.event().data("[Security & Quality] SonarQube results: 0 Critical, 0 Major vulnerabilities."));
                        Thread.sleep(1000);
                    } else if (stage.getName().equals("Kubernetes Rollout")) {
                        emitter.send(SseEmitter.event().data("[Deploy] Initializing K8s resources..."));
                        Thread.sleep(4000);
                        emitter.send(SseEmitter.event().data("[Deploy] Namespace: " + deployment.getApplicationId()));
                        emitter.send(SseEmitter.event().data("[Deploy] Applying Deployment resource..."));
                        Thread.sleep(6000);
                        emitter.send(SseEmitter.event().data("[Deploy] Application is now LIVE at: " + deployment.getIngressUrl()));
                    }

                    // Update stage to SUCCESS
                    stage.setStatus(DeploymentStage.PipelineStatus.SUCCESS);
                    stage.setEndTime(java.time.Instant.now());
                    deploymentRepository.saveAndFlush(deployment);
                    deploymentEventService.broadcastUpdate(deployment);
                }

                emitter.send(SseEmitter.event().data("\nLog stream finished."));
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
