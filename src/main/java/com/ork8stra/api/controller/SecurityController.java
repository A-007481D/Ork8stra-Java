package com.ork8stra.api.controller;

import com.ork8stra.applicationmanagement.Application;
import com.ork8stra.applicationmanagement.ApplicationRepository;
import com.ork8stra.projectmanagement.Project;
import com.ork8stra.projectmanagement.ProjectRepository;
import io.fabric8.kubernetes.api.model.networking.v1.NetworkPolicy;
import io.fabric8.kubernetes.client.KubernetesClient;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/security")
@RequiredArgsConstructor
public class SecurityController {

    private final KubernetesClient kubernetesClient;
    private final ApplicationRepository applicationRepository;
    private final ProjectRepository projectRepository;

    @GetMapping("/summary")
    public SecuritySummary getSummary() {
        List<NetworkPolicy> policies = kubernetesClient.network().v1().networkPolicies().inAnyNamespace().list().getItems();
        long projectCount = projectRepository.count();
        long appsCount = applicationRepository.count();

        // Simple risk assessment
        List<RiskItem> risks = new ArrayList<>();
        
        // Check for apps without resource limits (simulation based on metadata for now)
        List<Application> allApps = applicationRepository.findAll();
        long appsWithMissingLimits = allApps.stream()
                .filter(app -> app.getEnvVars() == null || !app.getEnvVars().containsKey("CPU_LIMIT"))
                .count();

        if (appsWithMissingLimits > 0) {
            risks.add(new RiskItem("Resource Saturation Risk", "MEDIUM", 
                    appsWithMissingLimits + " applications are running without explicit CPU/Memory limits."));
        }

        if (policies.isEmpty() && projectCount > 0) {
            risks.add(new RiskItem("Network Isolation Missing", "HIGH", 
                    "No NetworkPolicies found. All projects are natively flat and can communicate across namespaces."));
        }

        return new SecuritySummary(
                policies.size(),
                (int)projectCount,
                (int)appsCount,
                risks,
                "Healthy (Simulation)"
        );
    }

    @GetMapping("/policies")
    public List<PolicyInfo> getPolicies() {
        return kubernetesClient.network().v1().networkPolicies().inAnyNamespace().list().getItems().stream()
                .map(p -> new PolicyInfo(
                        p.getMetadata().getName(),
                        p.getMetadata().getNamespace(),
                        p.getSpec().getPolicyTypes().toString(),
                        "Active"
                ))
                .toList();
    }

    @Data
    @AllArgsConstructor
    public static class SecuritySummary {
        private int networkPolicyCount;
        private int projectsProtected;
        private int workloadsScanned;
        private List<RiskItem> activeRisks;
        private String complianceStatus;
    }

    @Data
    @AllArgsConstructor
    public static class RiskItem {
        private String title;
        private String severity; // HIGH, MEDIUM, LOW
        private String description;
    }

    @Data
    @AllArgsConstructor
    public static class PolicyInfo {
        private String name;
        private String namespace;
        private String type;
        private String status;
    }
}
