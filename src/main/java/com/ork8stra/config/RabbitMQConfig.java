package com.ork8stra.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String QUEUE_BUILD_JOBS = "ork8stra.build.jobs";
    public static final String EXCHANGE_BUILDS = "ork8stra.builds";
    public static final String ROUTING_KEY_TRIGGER = "build.trigger";

    @Bean
    public Queue buildJobsQueue() {
        return new Queue(QUEUE_BUILD_JOBS, true);
    }

    @Bean
    public DirectExchange buildsExchange() {
        return new DirectExchange(EXCHANGE_BUILDS);
    }

    @Bean
    public Binding binding(Queue buildJobsQueue, DirectExchange buildsExchange) {
        return BindingBuilder.bind(buildJobsQueue).to(buildsExchange).with(ROUTING_KEY_TRIGGER);
    }
}
