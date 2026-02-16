package com.ork8stra.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE_BUILDS = "ork8stra.builds";
    public static final String EXCHANGE_DEPLOYMENTS = "ork8stra.deployments";

    public static final String QUEUE_BUILD_TRIGGER = "ork8stra.build.trigger";
    public static final String QUEUE_BUILD_STATUS = "ork8stra.build.status";
    public static final String QUEUE_DEPLOYMENT_STATUS = "ork8stra.deployment.status";

    public static final String ROUTING_KEY_TRIGGER = "build.trigger";
    public static final String ROUTING_KEY_BUILD_STATUS = "build.status";
    public static final String ROUTING_KEY_DEPLOY_STATUS = "deploy.status";

    @Bean
    public TopicExchange buildsExchange() {
        return new TopicExchange(EXCHANGE_BUILDS);
    }

    @Bean
    public TopicExchange deploymentsExchange() {
        return new TopicExchange(EXCHANGE_DEPLOYMENTS);
    }

    @Bean
    public Queue buildTriggerQueue() {
        return QueueBuilder.durable(QUEUE_BUILD_TRIGGER).build();
    }

    @Bean
    public Queue buildStatusQueue() {
        return QueueBuilder.durable(QUEUE_BUILD_STATUS).build();
    }

    @Bean
    public Queue deploymentStatusQueue() {
        return QueueBuilder.durable(QUEUE_DEPLOYMENT_STATUS).build();
    }

    @Bean
    public Binding buildTriggerBinding(Queue buildTriggerQueue, TopicExchange buildsExchange) {
        return BindingBuilder.bind(buildTriggerQueue).to(buildsExchange).with(ROUTING_KEY_TRIGGER);
    }

    @Bean
    public Binding buildStatusBinding(Queue buildStatusQueue, TopicExchange buildsExchange) {
        return BindingBuilder.bind(buildStatusQueue).to(buildsExchange).with(ROUTING_KEY_BUILD_STATUS);
    }

    @Bean
    public Binding deploymentStatusBinding(Queue deploymentStatusQueue, TopicExchange deploymentsExchange) {
        return BindingBuilder.bind(deploymentStatusQueue).to(deploymentsExchange).with(ROUTING_KEY_DEPLOY_STATUS);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
