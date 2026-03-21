package com.ork8stra.deploymentengine;

import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.Random;

@Slf4j
@Service
@RequiredArgsConstructor
public class TrafficMetricsService {

    @Data
    @Builder
    public static class TrafficStats {
        private UUID appId;
        private double successRate;     // percentage 0-100
        private double averageLatencyMs; 
        private int requestsPerSecond;
    }

    public TrafficStats getTrafficMetrics(UUID appId) {
        // In a production environment, this service would issue an HTTP GET to:
        // http://ingress-nginx-controller-metrics.ingress-nginx.svc.cluster.local:10254/metrics
        // and parse the Prometheus format for nginx_ingress_controller_requests and nginx_ingress_controller_request_duration_seconds_sum
        
        // For development/MVP we return realistic simulated traffic stats based on app ID
        Random rand = new Random(appId.hashCode() + System.currentTimeMillis() / 60000); 
        
        double success = 97.0 + (rand.nextDouble() * 2.9); // 97.0% - 99.9%
        double latency = 15.0 + (rand.nextDouble() * 85.0); // 15ms - 100ms
        int rps = 5 + rand.nextInt(200);                    // 5 - 205 rps

        return TrafficStats.builder()
                .appId(appId)
                .successRate(success)
                .averageLatencyMs(latency)
                .requestsPerSecond(rps)
                .build();
    }
}
