package com.ork8stra.deploymentengine;

import io.fabric8.kubernetes.api.model.apps.Deployment;
import io.fabric8.kubernetes.client.KubernetesClient;
import io.fabric8.kubernetes.client.Watch;
import io.fabric8.kubernetes.client.Watcher;
import io.fabric8.kubernetes.client.WatcherException;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class ServiceHealthWatcher {

    private final KubernetesClient kubernetesClient;
    private final DeploymentRepository deploymentRepository;
    private ServiceHealthWatcher self;
    private Watch watch;

    @org.springframework.beans.factory.annotation.Autowired
    public void setSelf(@org.springframework.context.annotation.Lazy ServiceHealthWatcher self) {
        this.self = self;
    }

    @PostConstruct
    public void init() {
        log.info("Initializing Service Health Watcher...");
        startWatching();
    }

    private void startWatching() {
        try {
            var apps = kubernetesClient.apps();
            if (apps == null) return;
            var deployments = apps.deployments();
            if (deployments == null) return;
            var inAnyNamespace = deployments.inAnyNamespace();
            if (inAnyNamespace == null) return;

            watch = inAnyNamespace.withLabel("managed-by", "ork8stra")
                    .watch(new Watcher<Deployment>() {
                        @Override
                        public void eventReceived(Action action, Deployment resource) {
                            if (action == Action.MODIFIED || action == Action.ADDED) {
                                self.reconcileStatus(resource);
                            }
                        }

                        @Override
                        public void onClose(WatcherException e) {
                            if (e != null) {
                                log.error("Service Health Watcher closed with error", e);
                                // Simple retry after 5 seconds
                                try { Thread.sleep(5000); } catch (InterruptedException ignore) {}
                                startWatching();
                            }
                        }
                    });
        } catch (Exception e) {
            log.warn("Could not start Service Health Watcher (cluster may be unreachable): {}", e.getMessage());
        }
    }

    @Transactional
    public void reconcileStatus(Deployment k8sDeployment) {
        String appIdStr = k8sDeployment.getMetadata().getAnnotations() != null ?
                k8sDeployment.getMetadata().getAnnotations().get("ork8stra.com/app-id") : null;

        if (appIdStr == null) return;

        UUID appId = UUID.fromString(appIdStr);
        deploymentRepository.findFirstByApplicationIdOrderByDeployedAtDesc(appId).ifPresent(deployment -> {
            DeploymentStatus newStatus = determineStatus(k8sDeployment);
            if (deployment.getStatus() != newStatus) {
                log.info("Reconciling health for app {}: {} -> {}", appId, deployment.getStatus(), newStatus);
                deployment.setStatus(newStatus);
                deployment.setReplicas(k8sDeployment.getSpec().getReplicas() != null ? k8sDeployment.getSpec().getReplicas() : 0);
                deploymentRepository.save(deployment);
            }
        });
    }

    private DeploymentStatus determineStatus(Deployment k8sDeployment) {
        if (k8sDeployment.getStatus() == null || k8sDeployment.getSpec() == null) {
            return DeploymentStatus.IN_PROGRESS;
        }

        var status = k8sDeployment.getStatus();
        var spec = k8sDeployment.getSpec();

        int desired = spec.getReplicas() != null ? spec.getReplicas() : 0;
        if (desired == 0) {
            return DeploymentStatus.STOPPED;
        }

        int ready = status.getReadyReplicas() != null ? status.getReadyReplicas() : 0;
        int unavailable = status.getUnavailableReplicas() != null ? status.getUnavailableReplicas() : 0;

        if (ready >= desired) {
            return DeploymentStatus.HEALTHY;
        }

        // Check for actual failure conditions in pods if possible
        // For now, if we have replicas but none are ready and we have unavailable, stay in IN_PROGRESS
        // unless we have specific failure signals from k8s status conditions
        boolean isFailed = status.getConditions() != null && status.getConditions().stream()
                .anyMatch(c -> "Available".equals(c.getType()) && "False".equals(c.getStatus()) && "MinimumReplicasUnavailable".equals(c.getReason()));
        
        // Actually, during a fresh deploy, MinimumReplicasUnavailable is normal.
        // So we only return UNHEALTHY if it's been in this state for a long time (not handled here) 
        // or if we see specific error reasons.
        
        return DeploymentStatus.IN_PROGRESS;
    }

    @PreDestroy
    public void cleanup() {
        if (watch != null) {
            watch.close();
        }
    }
}
