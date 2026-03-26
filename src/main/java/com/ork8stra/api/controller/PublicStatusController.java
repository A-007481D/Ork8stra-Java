package com.ork8stra.api.controller;

import com.ork8stra.deploymentengine.Deployment;
import com.ork8stra.deploymentengine.DeploymentRepository;
import com.ork8stra.deploymentengine.DeploymentStatus;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/v1/public")
@RequiredArgsConstructor
public class PublicStatusController {

    private final DeploymentRepository deploymentRepository;

    @GetMapping("/app-status")
    public ResponseEntity<AppStatusResponse> getAppStatus(@RequestParam String host) {
        log.debug("Public status check for host: {}", host);
        
        // Find deployment by ingress host
        Optional<Deployment> deployment = deploymentRepository.findAll().stream()
                .filter(d -> host.equals(d.getIngressUrl()) || (d.getIngressUrl() != null && d.getIngressUrl().contains(host)))
                .findFirst();

        if (deployment.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Deployment d = deployment.get();
        return ResponseEntity.ok(AppStatusResponse.builder()
                .status(d.getStatus().name())
                .replicas(d.getReplicas())
                .build());
    }

    @Data
    @Builder
    public static class AppStatusResponse {
        private String status;
        private Integer replicas;
    }
}
