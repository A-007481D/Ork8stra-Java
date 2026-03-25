package com.ork8stra.deploymentengine;

import io.fabric8.kubernetes.api.model.Event;
import io.fabric8.kubernetes.client.KubernetesClient;
import io.fabric8.kubernetes.client.Watcher;
import io.fabric8.kubernetes.client.WatcherException;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectEventService {

    private final KubernetesClient kubernetesClient;
    private final Map<String, List<K8sEvent>> projectEvents = new ConcurrentHashMap<>();
    private static final int MAX_EVENTS_PER_PROJECT = 50;

    @Data
    @Builder
    public static class K8sEvent {
        private String id;
        private String type;
        private String reason;
        private String message;
        private String objectName;
        private String timestamp;
    }

    @PostConstruct
    public void init() {
        log.info("Initializing Global Project Event Watcher...");
        startGlobalWatcher();
    }

    private void startGlobalWatcher() {
        try {
            var v1 = kubernetesClient.v1();
            if (v1 == null) return;
            var events = v1.events();
            if (events == null) return;
            var inAnyNamespace = events.inAnyNamespace();
            if (inAnyNamespace == null) return;
            
            inAnyNamespace.watch(new Watcher<Event>() {
                @Override
                public void eventReceived(Action action, Event event) {
                    if (event.getMetadata().getNamespace().startsWith("project")) {
                        handleEvent(event);
                    }
                }

                @Override
                public void onClose(WatcherException cause) {
                    if (cause != null) {
                        log.error("Global Event Watcher closed with error, restarting...", cause);
                        startGlobalWatcher();
                    }
                }
            });
        } catch (Exception e) {
            log.warn("Could not start Global Event Watcher (cluster may be unreachable): {}", e.getMessage());
        }
    }

    private void handleEvent(Event event) {
        String namespace = event.getMetadata().getNamespace();
        
        K8sEvent e = K8sEvent.builder()
                .id(UUID.randomUUID().toString())
                .type(event.getType())
                .reason(event.getReason())
                .message(event.getMessage())
                .objectName(event.getInvolvedObject().getName())
                .timestamp(event.getLastTimestamp() != null ? event.getLastTimestamp() : event.getEventTime().getTime())
                .build();

        projectEvents.computeIfAbsent(namespace, k -> new CopyOnWriteArrayList<>()).add(0, e);
        
        List<K8sEvent> events = projectEvents.get(namespace);
        if (events.size() > MAX_EVENTS_PER_PROJECT) {
            events.remove(events.size() - 1);
        }
    }

    public List<K8sEvent> getRecentEvents(String namespace) {
        return projectEvents.getOrDefault(namespace, Collections.emptyList());
    }
}
