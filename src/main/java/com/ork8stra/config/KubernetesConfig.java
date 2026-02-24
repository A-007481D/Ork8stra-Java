package com.ork8stra.config;

import io.fabric8.kubernetes.client.KubernetesClient;
import io.fabric8.kubernetes.client.KubernetesClientBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * Kubernetes client configuration.
 */
@Configuration
public class KubernetesConfig {

    @Bean
    @Profile("!no-k8s")
    public KubernetesClient kubernetesClient() {
        io.fabric8.kubernetes.client.Config config = new io.fabric8.kubernetes.client.ConfigBuilder()
                .withConnectionTimeout(2000)
                .withRequestTimeout(2000)
                .build();
        return new KubernetesClientBuilder().withConfig(config).build();
    }
}
