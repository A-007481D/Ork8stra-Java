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
import io.fabric8.kubernetes.api.model.Pod;
import com.ork8stra.applicationmanagement.Application;
import com.ork8stra.applicationmanagement.ApplicationService;
import com.ork8stra.projectmanagement.Project;
import com.ork8stra.projectmanagement.ProjectService;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class ServiceHealthWatcher {

    private final KubernetesClient kubernetesClient;
    private final DeploymentRepository deploymentRepository;
    private final SmartPortReconciler smartPortReconciler;
    private final DeploymentService deploymentService;
    private final ApplicationService applicationService;
    private final ProjectService projectService;
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

            if (newStatus == DeploymentStatus.HEALTHY) {
                self.performSmartPortReconciliation(appId, k8sDeployment.getMetadata().getNamespace());
            }
        });
    }

    @Transactional
    public void performSmartPortReconciliation(UUID appId, String namespace) {
        Application app = applicationService.getApplication(appId);
        Project project = projectService.getProjectById(app.getProjectId());
        
        // Find one healthy pod
        var podList = kubernetesClient.pods().inNamespace(namespace)
                .withLabel("app", app.getName().toLowerCase().replaceAll("[^a-z0-9-]", "-")
                                .replaceAll("-+", "-")
                                .replaceAll("^-|-$", ""))
                .list().getItems();
        
        if (podList.isEmpty()) return;
        Pod pod = podList.get(0);
        
        Integer detectedPort = smartPortReconciler.discoverListeningPort(pod);
        if (detectedPort != null && !detectedPort.equals(app.getContainerPort())) {
            log.info("Smart Discovery: Port mismatch for app {}. Configured: {}, Detected: {}. Updating...", 
                app.getName(), app.getContainerPort(), detectedPort);
            
            app.setContainerPort(detectedPort);
            applicationService.updateApplication(app);
            
            // Trigger routing update ONLY (no restart)
            deploymentService.updateRoutingOnly(app, project, detectedPort);
        }
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
        if (ready >= desired) {
            return DeploymentStatus.HEALTHY;
        }

        return DeploymentStatus.IN_PROGRESS;
    }

    @PreDestroy
    public void cleanup() {
        if (watch != null) {
            watch.close();
        }
    }
}
