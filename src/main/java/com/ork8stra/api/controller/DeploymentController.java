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

    @GetMapping
    public ResponseEntity<List<DeploymentResponse>> listDeployments(@PathVariable UUID appId) {
        List<Deployment> deployments = deploymentRepository.findByApplicationIdOrderByDeployedAtDesc(appId);
        return ResponseEntity.ok(deployments.stream().map(DeploymentResponse::from).toList());
    }

    @GetMapping("/{deploymentId}")
    public ResponseEntity<DeploymentResponse> getDeployment(
            @PathVariable UUID appId,
            @PathVariable UUID deploymentId) {
        Deployment deployment = deploymentRepository.findById(deploymentId)
                .orElseThrow(() -> new IllegalArgumentException("Deployment not found: " + deploymentId));
        return ResponseEntity.ok(DeploymentResponse.from(deployment));
    }
}
