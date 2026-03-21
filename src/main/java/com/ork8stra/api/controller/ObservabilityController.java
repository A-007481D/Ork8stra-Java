package com.ork8stra.api.controller;

import com.ork8stra.applicationmanagement.Application;
import com.ork8stra.applicationmanagement.ApplicationService;
import com.ork8stra.deploymentengine.*;
import com.ork8stra.projectmanagement.Project;
import com.ork8stra.projectmanagement.ProjectService;

import io.fabric8.kubernetes.api.model.*;
import io.fabric8.kubernetes.api.model.networking.v1.Ingress;
import io.fabric8.kubernetes.api.model.networking.v1.NetworkPolicy;
import io.fabric8.kubernetes.api.model.storage.StorageClass;
import io.fabric8.kubernetes.api.model.metrics.v1beta1.NodeMetrics;
import io.fabric8.kubernetes.client.KubernetesClient;

import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;


import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/v1/observability")
@RequiredArgsConstructor
public class ObservabilityController {

    private final KubernetesClient kubernetesClient;
    private final ProjectService projectService;
    private final ApplicationService applicationService;
    private final DeploymentRepository deploymentRepository;

    // ========== POD LOGS ==========

    @Data @Builder
    public static class PodLogEntry {
        private String podName;
        private String namespace;
        private String appName;
        private String projectName;
        private String logs;
    }

    @GetMapping("/logs/{appId}")
    public ResponseEntity<PodLogEntry> getPodLogs(
            @PathVariable UUID appId,
            @RequestParam(defaultValue = "200") int tailLines) {
        Application app = applicationService.getApplication(appId);
        Project project = projectService.getProjectById(app.getProjectId());
        String namespace = project.getK8sNamespace();
        String labelName = toK8sName(app.getName());

        List<Pod> pods = kubernetesClient.pods()
                .inNamespace(namespace)
                .withLabel("app", labelName)
                .list().getItems();

        if (pods.isEmpty()) {
            return ResponseEntity.ok(PodLogEntry.builder()
                    .podName("N/A")
                    .namespace(namespace)
                    .appName(app.getName())
                    .projectName(project.getName())
                    .logs("No pods found for this service.")
                    .build());
        }

        Pod pod = pods.get(0); // primary pod
        String logText;
        try {
            logText = kubernetesClient.pods()
                    .inNamespace(namespace)
                    .withName(pod.getMetadata().getName())
                    .tailingLines(tailLines)
                    .getLog();
        } catch (Exception e) {
            logText = "Error retrieving logs: " + e.getMessage();
        }

        return ResponseEntity.ok(PodLogEntry.builder()
                .podName(pod.getMetadata().getName())
                .namespace(namespace)
                .appName(app.getName())
                .projectName(project.getName())
                .logs(logText != null ? logText : "")
                .build());
    }

    // ========== ALL SERVICES (flat list for log picker) ==========

    @Data @Builder
    public static class ServiceEntry {
        private UUID appId;
        private String appName;
        private String projectName;
        private UUID projectId;
    }

    @GetMapping("/services")
    public ResponseEntity<List<ServiceEntry>> getAllServices() {
        List<Project> projects = projectService.getAllProjects();
        List<ServiceEntry> entries = new ArrayList<>();
        for (Project p : projects) {
            List<Application> apps = applicationService.getApplicationsByProject(p.getId());
            for (Application a : apps) {
                entries.add(ServiceEntry.builder()
                        .appId(a.getId())
                        .appName(a.getName())
                        .projectName(p.getName())
                        .projectId(p.getId())
                        .build());
            }
        }
        return ResponseEntity.ok(entries);
    }

    // ========== NODE HEALTH ==========

    @Data @Builder
    public static class NodeInfo {
        private String name;
        private String status;
        private String kubeletVersion;
        private String os;
        private String arch;
        private String containerRuntime;
        private String cpuCapacity;
        private String memoryCapacity;
        private double cpuUsagePercent;
        private double memoryUsagePercent;
        private int podCount;
        private String createdAt;
    }

    @GetMapping("/nodes")
    public ResponseEntity<List<NodeInfo>> getNodeHealth() {
        List<Node> nodes = kubernetesClient.nodes().list().getItems();

        List<NodeMetrics> nodeMetrics;
        try {
            nodeMetrics = kubernetesClient.top().nodes().metrics().getItems();
        } catch (Exception e) {
            log.debug("Node metrics unavailable: {}", e.getMessage());
            nodeMetrics = Collections.emptyList();
        }

        Map<String, NodeMetrics> metricsMap = nodeMetrics.stream()
                .collect(Collectors.toMap(m -> m.getMetadata().getName(), m -> m, (a, b) -> a));

        List<NodeInfo> result = new ArrayList<>();
        for (Node node : nodes) {
            String name = node.getMetadata().getName();
            NodeStatus nodeStatus = node.getStatus();

            String statusText = nodeStatus.getConditions().stream()
                    .filter(c -> "Ready".equals(c.getType()))
                    .map(c -> "True".equals(c.getStatus()) ? "Ready" : "NotReady")
                    .findFirst().orElse("Unknown");

            NodeSystemInfo sysInfo = nodeStatus.getNodeInfo();
            Map<String, Quantity> capacity = nodeStatus.getCapacity();

            double cpuCap = parseCpuQuantity(capacity.getOrDefault("cpu", new Quantity("0")));
            long memCap = parseMemQuantity(capacity.getOrDefault("memory", new Quantity("0")));

            double cpuUseFraction = 0;
            double memUseFraction = 0;

            NodeMetrics nm = metricsMap.get(name);
            if (nm != null) {
                double cpuUse = parseCpuQuantity(nm.getUsage().getOrDefault("cpu", new Quantity("0")));
                long memUse = parseMemQuantity(nm.getUsage().getOrDefault("memory", new Quantity("0")));
                cpuUseFraction = cpuCap > 0 ? (cpuUse / cpuCap) * 100 : 0;
                memUseFraction = memCap > 0 ? ((double) memUse / memCap) * 100 : 0;
            }

            // Count pods on this node
            int podCount;
            try {
                podCount = kubernetesClient.pods().inAnyNamespace()
                        .withField("spec.nodeName", name)
                        .list().getItems().size();
            } catch (Exception e) {
                podCount = 0;
            }

            result.add(NodeInfo.builder()
                    .name(name)
                    .status(statusText)
                    .kubeletVersion(sysInfo.getKubeletVersion())
                    .os(sysInfo.getOperatingSystem())
                    .arch(sysInfo.getArchitecture())
                    .containerRuntime(sysInfo.getContainerRuntimeVersion())
                    .cpuCapacity(capacity.getOrDefault("cpu", new Quantity("0")).getAmount() + " cores")
                    .memoryCapacity(formatBytes(memCap))
                    .cpuUsagePercent(Math.round(cpuUseFraction * 10.0) / 10.0)
                    .memoryUsagePercent(Math.round(memUseFraction * 10.0) / 10.0)
                    .podCount(podCount)
                    .createdAt(node.getMetadata().getCreationTimestamp())
                    .build());
        }
        return ResponseEntity.ok(result);
    }

    // ========== NETWORK POLICIES ==========

    @Data @Builder
    public static class NetworkPolicyInfo {
        private String name;
        private String namespace;
        private String podSelector;
        private int ingressRules;
        private int egressRules;
        private String createdAt;
    }

    @GetMapping("/network-policies")
    public ResponseEntity<List<NetworkPolicyInfo>> getNetworkPolicies() {
        List<NetworkPolicy> policies = kubernetesClient.network().networkPolicies()
                .inAnyNamespace().list().getItems();

        List<NetworkPolicyInfo> result = policies.stream()
                .filter(p -> p.getMetadata().getNamespace().startsWith("project"))
                .map(p -> NetworkPolicyInfo.builder()
                        .name(p.getMetadata().getName())
                        .namespace(p.getMetadata().getNamespace())
                        .podSelector(p.getSpec().getPodSelector() != null &&
                                p.getSpec().getPodSelector().getMatchLabels() != null
                                ? p.getSpec().getPodSelector().getMatchLabels().toString()
                                : "All Pods")
                        .ingressRules(p.getSpec().getIngress() != null ? p.getSpec().getIngress().size() : 0)
                        .egressRules(p.getSpec().getEgress() != null ? p.getSpec().getEgress().size() : 0)
                        .createdAt(p.getMetadata().getCreationTimestamp())
                        .build()
                ).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    // ========== INFRASTRUCTURE: STORAGE ==========

    @Data @Builder
    public static class StorageInfo {
        private String name;
        private String namespace;
        private String status;
        private String capacity;
        private String storageClass;
        private String accessModes;
        private String createdAt;
    }

    @GetMapping("/infra/storage")
    public ResponseEntity<Map<String, Object>> getStorageInfo() {
        List<PersistentVolumeClaim> pvcs = kubernetesClient.persistentVolumeClaims().inAnyNamespace().list().getItems();
        List<StorageClass> storageClasses = kubernetesClient.storage().v1().storageClasses().list().getItems();

        List<StorageInfo> pvcList = pvcs.stream()
                .filter(p -> p.getMetadata().getNamespace().startsWith("project"))
                .map(p -> StorageInfo.builder()
                        .name(p.getMetadata().getName())
                        .namespace(p.getMetadata().getNamespace())
                        .status(p.getStatus().getPhase())
                        .capacity(p.getSpec().getResources().getRequests().getOrDefault("storage", new Quantity("0")).getAmount())
                        .storageClass(p.getSpec().getStorageClassName())
                        .accessModes(p.getSpec().getAccessModes().toString())
                        .createdAt(p.getMetadata().getCreationTimestamp())
                        .build())
                .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("pvcs", pvcList);
        result.put("storageClasses", storageClasses.stream().map(sc -> sc.getMetadata().getName()).collect(Collectors.toList()));
        return ResponseEntity.ok(result);
    }

    // ========== INFRASTRUCTURE: NETWORK ==========

    @Data @Builder
    public static class NetworkAsset {
        private String name;
        private String namespace;
        private String type; // Service or Ingress
        private String spec; // e.g. Port or Host
        private String status;
        private String createdAt;
    }

    @GetMapping("/infra/network")
    public ResponseEntity<List<NetworkAsset>> getNetworkAssets() {
        List<NetworkAsset> assets = new ArrayList<>();

        // Services
        List<Service> services = kubernetesClient.services().inAnyNamespace().list().getItems();
        services.stream()
                .filter(s -> s.getMetadata().getNamespace().startsWith("project"))
                .forEach(s -> assets.add(NetworkAsset.builder()
                        .name(s.getMetadata().getName())
                        .namespace(s.getMetadata().getNamespace())
                        .type("Service")
                        .spec(s.getSpec().getType() + " / " + (s.getSpec().getPorts() != null && !s.getSpec().getPorts().isEmpty() ? s.getSpec().getPorts().get(0).getPort() : "N/A"))
                        .status("Active")
                        .createdAt(s.getMetadata().getCreationTimestamp())
                        .build()));

        // Ingresses
        List<Ingress> ingresses = kubernetesClient.network().v1().ingresses().inAnyNamespace().list().getItems();
        ingresses.stream()
                .filter(i -> i.getMetadata().getNamespace().startsWith("project"))
                .forEach(i -> assets.add(NetworkAsset.builder()
                        .name(i.getMetadata().getName())
                        .namespace(i.getMetadata().getNamespace())
                        .type("Ingress")
                        .spec(i.getSpec().getRules() != null && !i.getSpec().getRules().isEmpty() ? i.getSpec().getRules().get(0).getHost() : "N/A")
                        .status("Live")
                        .createdAt(i.getMetadata().getCreationTimestamp())
                        .build()));

        return ResponseEntity.ok(assets);
    }

    // ========== INFRASTRUCTURE: TOPOLOGY ==========

    @Data @Builder
    public static class TopologyEntry {
        private String projectName;
        private String namespace;
        private int appCount;
        private int podCount;
        private String status;
    }

    @GetMapping("/infra/topology")
    public ResponseEntity<List<TopologyEntry>> getTopology() {
        List<Project> projects = projectService.getAllProjects();
        List<TopologyEntry> result = new ArrayList<>();

        for (Project p : projects) {
            String ns = p.getK8sNamespace();
            int apps = applicationService.getApplicationsByProject(p.getId()).size();
            int pods = 0;
            try {
                pods = kubernetesClient.pods().inNamespace(ns).list().getItems().size();
            } catch (Exception e) {}

            result.add(TopologyEntry.builder()
                    .projectName(p.getName())
                    .namespace(ns)
                    .appCount(apps)
                    .podCount(pods)
                    .status("Provisioned")
                    .build());
        }

        return ResponseEntity.ok(result);
    }

    // ========== FLEET-WIDE DEPLOYMENTS ==========

    @Data @Builder
    public static class FleetDeployment {
        private UUID id;
        private String appName;
        private String projectName;
        private String imageTag;
        private int replicas;
        private String status;
        private String liveUrl;
        private String deployedAt;
    }

    @GetMapping("/deployments")
    public ResponseEntity<List<FleetDeployment>> getFleetDeployments() {
        List<Project> projects = projectService.getAllProjects();
        List<FleetDeployment> result = new ArrayList<>();

        for (Project p : projects) {
            List<Application> apps = applicationService.getApplicationsByProject(p.getId());
            for (Application app : apps) {
                List<Deployment> deployments = deploymentRepository.findByApplicationIdOrderByDeployedAtDesc(app.getId());
                for (Deployment d : deployments) {
                    result.add(FleetDeployment.builder()
                            .id(d.getId())
                            .appName(app.getName())
                            .projectName(p.getName())
                            .imageTag(d.getVersion())
                            .replicas(d.getReplicas())
                            .status(d.getStatus().name())
                            .liveUrl(d.getIngressUrl())
                            .deployedAt(d.getDeployedAt() != null ? d.getDeployedAt().toString() : null)
                            .build());
                }
            }
        }

        result.sort((a, b) -> {
            if (a.deployedAt == null) return 1;
            if (b.deployedAt == null) return -1;
            return b.deployedAt.compareTo(a.deployedAt);
        });

        return ResponseEntity.ok(result);
    }

    // ========== FLEET-WIDE EVENTS (all namespaces) ==========

    @GetMapping("/events")
    public ResponseEntity<List<ProjectEventService.K8sEvent>> getFleetEvents() {
        List<Project> projects = projectService.getAllProjects();
        List<ProjectEventService.K8sEvent> allEvents = new ArrayList<>();
        // Re-read fresh events from K8s
        for (Project p : projects) {
            try {
                List<io.fabric8.kubernetes.api.model.Event> events = kubernetesClient.v1().events()
                        .inNamespace(p.getK8sNamespace()).list().getItems();
                for (io.fabric8.kubernetes.api.model.Event ev : events) {
                    allEvents.add(ProjectEventService.K8sEvent.builder()
                            .id(UUID.randomUUID().toString())
                            .type(ev.getType())
                            .reason(ev.getReason())
                            .message(ev.getMessage())
                            .objectName(ev.getInvolvedObject().getName())
                            .timestamp(ev.getLastTimestamp() != null ? ev.getLastTimestamp()
                                    : (ev.getEventTime() != null ? ev.getEventTime().getTime() : Instant.now().toString()))
                            .build());
                }
            } catch (Exception e) {
                log.debug("Could not fetch events for namespace {}: {}", p.getK8sNamespace(), e.getMessage());
            }
        }
        allEvents.sort((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()));
        return ResponseEntity.ok(allEvents.size() > 100 ? allEvents.subList(0, 100) : allEvents);
    }

    // ========== Helpers ==========

    private String toK8sName(String rawName) {
        return rawName.toLowerCase().replaceAll("[^a-z0-9-]", "-")
                .replaceAll("-+", "-").replaceAll("^-|-$", "");
    }

    private double parseCpuQuantity(Quantity q) {
        String amount = q.getAmount();
        String format = q.getFormat();
        try {
            double val = Double.parseDouble(amount);
            if (format != null && format.equals("n")) return val / 1_000_000_000.0;
            if (format != null && format.equals("m")) return val / 1000.0;
            if (amount.endsWith("n")) return Double.parseDouble(amount.replace("n","")) / 1_000_000_000.0;
            if (amount.endsWith("m")) return Double.parseDouble(amount.replace("m","")) / 1000.0;
            return val;
        } catch (Exception e) { return 0; }
    }

    private long parseMemQuantity(Quantity q) {
        String amount = q.getAmount();
        try {
            if (amount.endsWith("Ki")) return (long)(Double.parseDouble(amount.replace("Ki","")) * 1024);
            if (amount.endsWith("Mi")) return (long)(Double.parseDouble(amount.replace("Mi","")) * 1024 * 1024);
            if (amount.endsWith("Gi")) return (long)(Double.parseDouble(amount.replace("Gi","")) * 1024 * 1024 * 1024);
            return Long.parseLong(amount);
        } catch (Exception e) { return 0; }
    }

    private String formatBytes(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024*1024) return String.format("%.1f KiB", bytes / 1024.0);
        if (bytes < 1024*1024*1024) return String.format("%.1f MiB", bytes / (1024.0*1024));
        return String.format("%.1f GiB", bytes / (1024.0*1024*1024));
    }
}
