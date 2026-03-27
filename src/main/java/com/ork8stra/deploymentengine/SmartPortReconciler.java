package com.ork8stra.deploymentengine;
 
import io.fabric8.kubernetes.api.model.Pod;
import io.fabric8.kubernetes.client.KubernetesClient;
import io.fabric8.kubernetes.client.dsl.ExecListener;
import io.fabric8.kubernetes.client.dsl.ExecWatch;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.OutputStream;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * SmartPortReconciler: Discovers the actual listening port of a container 
 * by inspecting /proc/net/tcp via kubectl exec.
 * This is "zero-config" infrastructure that adapts to any app.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SmartPortReconciler {

    private final KubernetesClient kubernetesClient;

    // Standard ports to ignore (system services, noise)
    private static final Set<Integer> IGNORED_PORTS = Set.of(22, 111, 3001); // 3001 is our own sidecar/utility usually

    public Integer discoverListeningPort(Pod pod) {
        String namespace = pod.getMetadata().getNamespace();
        String podName = pod.getMetadata().getName();

        // Retry logic: Apps might take a few seconds to initialize listeners
        for (int attempt = 1; attempt <= 3; attempt++) {
            if (attempt > 1) {
                try { Thread.sleep(2000); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
                log.info("Smart Discovery: Retry attempt {}/3 for pod {}/{}", attempt, namespace, podName);
            }

            Integer port = performDiscoveryAttempt(pod);
            if (port != null) return port;
        }

        log.warn("Smart Discovery: No active listener found for pod {} after 3 attempts", podName);
        return null;
    }

    private Integer performDiscoveryAttempt(Pod pod) {
        String namespace = pod.getMetadata().getNamespace();
        String podName = pod.getMetadata().getName();
        
        log.info("Smart Discovery: Probing /proc/net/tcp for pod {}/{}", namespace, podName);
        StringBuilder outputBuilder = new StringBuilder();
        CountDownLatch latch = new CountDownLatch(1);

        try {
            // Check both IPv4 and IPv6 to be truly smart!
            String command = "cat /proc/net/tcp /proc/net/tcp6 2>/dev/null";
            
            ExecWatch watch = kubernetesClient.pods().inNamespace(namespace).withName(podName)
                    .writingOutput(new OutputStream() {
                        @Override
                        public void write(int b) {
                            outputBuilder.append((char) b);
                        }
                    })
                    .usingListener(new ExecListener() {
                        @Override
                        public void onOpen() {}

                        @Override
                        public void onFailure(Throwable t, Response response) {
                            log.warn("Smart Discovery: Exec failed for {}: {}", podName, t.getMessage());
                            latch.countDown();
                        }

                        @Override
                        public void onClose(int code, String reason) {
                            latch.countDown();
                        }
                    })
                    .exec("sh", "-c", command);
            
            // Wait for completion with timeout
            if (latch.await(5, TimeUnit.SECONDS)) {
                watch.close();
                String output = outputBuilder.toString();
                Integer port = parseListeningPort(output);
                if (port != null) {
                    log.info("Smart Discovery: Detected port {} for pod {}", port, podName);
                }
                return port;
            } else {
                log.warn("Smart Discovery: Timeout waiting for pod {} exec output", podName);
                watch.close();
            }
        } catch (Exception e) {
            log.error("Smart Discovery: Error during probe for {}: {}", podName, e.getMessage());
        }

        return null;
    }

    /**
     * Parses /proc/net/tcp output to find listening ports.
     * Line format: 
     * sl  local_address rem_address   st tx_queue rx_queue tr tm->when retr   uid  timeout inode
     * 0: 00000000:1F90 00000000:0000 0A 00000000:00000000 00:00000000 00000000     0        0 23456
     * status 0A is LISTEN.
     */
    private Integer parseListeningPort(String content) {
        if (content == null || content.isBlank()) return null;

        Set<Integer> foundPorts = new HashSet<>();
        String[] lines = content.split("\n");
        
        // Pattern for local_address and state
        // Handles both IPv4 (8 digits) and IPv6 (32 digits)
        Pattern pattern = Pattern.compile("^\\s*\\d+:\\s+[0-9A-F]{8,32}:([0-9A-F]{4})\\s+[0-9A-F]{8,32}:[0-9A-F]{4}\\s+0A");

        for (String line : lines) {
            Matcher m = pattern.matcher(line);
            if (m.find()) {
                try {
                    int port = Integer.parseInt(m.group(1), 16);
                    if (!IGNORED_PORTS.contains(port)) {
                        foundPorts.add(port);
                    }
                } catch (NumberFormatException ignored) {}
            }
        }

        if (foundPorts.isEmpty()) {
            return null;
        }

        // Heuristic: If multiple, prefer common frontend/app ports
        if (foundPorts.size() > 1) {
            // Priority list: Frontend/Web -> Common App -> API
            List<Integer> priorities = List.of(8080, 4200, 3000, 4000, 80, 5000, 8000, 3001);
            for (int p : priorities) {
                if (foundPorts.contains(p)) return p;
            }
        }

        return foundPorts.iterator().next();
    }
}
