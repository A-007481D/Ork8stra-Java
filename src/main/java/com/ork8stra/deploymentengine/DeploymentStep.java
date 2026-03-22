package com.ork8stra.deploymentengine;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "deployment_steps")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeploymentStep {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeploymentStage.PipelineStatus status;

    @Column(name = "log_snippet", length = 1000)
    private String logSnippet;

    @Builder.Default
    private Instant timestamp = Instant.now();
}
