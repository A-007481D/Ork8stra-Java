package com.ork8stra.api.controller;

import com.ork8stra.api.dto.DeploymentResponse;
import com.ork8stra.deploymentengine.Deployment;
import com.ork8stra.deploymentengine.DeploymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/apps/{appId}/deployments")
@RequiredArgsConstructor
public class DeploymentController {

    private final DeploymentRepository deploymentRepository;
    private final com.ork8stra.deploymentengine.DeploymentEventService deploymentEventService;
    private final com.ork8stra.deploymentengine.DeploymentLogService deploymentLogService;
    private final com.ork8stra.deploymentengine.DeploymentService deploymentService;

    @GetMapping
    public ResponseEntity<List<DeploymentResponse>> listDeployments(@PathVariable UUID appId) {
        List<Deployment> deployments = deploymentRepository.findByApplicationIdOrderByDeployedAtDesc(appId);
        return ResponseEntity.ok(deployments.stream().map(DeploymentResponse::from).toList());
    }

    @GetMapping("/{deploymentId}")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<DeploymentResponse> getDeployment(
            @PathVariable UUID appId,
            @PathVariable UUID deploymentId) {
        Deployment deployment = deploymentRepository.findById(deploymentId)
                .orElseThrow(() -> new IllegalArgumentException("Deployment not found: " + deploymentId));
        
        // Auto-initialize stages for older deployments that don't have them
        boolean needsInit = deployment.getStages() == null || deployment.getStages().isEmpty();
        if (needsInit) {
            deploymentService.initializeStages(deployment);
            deploymentRepository.saveAndFlush(deployment);
        }

        return ResponseEntity.ok(DeploymentResponse.from(deployment));
    }

    @GetMapping(value = "/{deploymentId}/events", produces = org.springframework.http.MediaType.TEXT_EVENT_STREAM_VALUE)
    public org.springframework.web.servlet.mvc.method.annotation.SseEmitter subscribeToDeployment(
            @PathVariable UUID appId,
            @PathVariable UUID deploymentId) {
        return deploymentEventService.subscribe(deploymentId);
    }

    @GetMapping(value = "/{deploymentId}/logs", produces = org.springframework.http.MediaType.TEXT_EVENT_STREAM_VALUE)
    public org.springframework.web.servlet.mvc.method.annotation.SseEmitter streamDeploymentLogs(
            @PathVariable UUID appId,
            @PathVariable UUID deploymentId,
            @RequestParam(required = false) String stageId) {
        return deploymentLogService.streamDeploymentLogs(deploymentId, stageId);
    }
}
