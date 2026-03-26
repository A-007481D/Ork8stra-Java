package com.ork8stra.deploymentengine;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "deployments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Deployment {

    @Id
    private UUID id;
    private UUID applicationId;
    private UUID userId;
    private String version; // Image Tag
    private int replicas;

    @Enumerated(EnumType.STRING)
    private DeploymentStatus status;

    private String ingressUrl;
    private Instant deployedAt;

    @OneToMany(mappedBy = "deployment", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private List<DeploymentStage> stages = new ArrayList<>();

    public Deployment(UUID applicationId, String version) {
        this.id = UUID.randomUUID();
        this.applicationId = applicationId;
        this.version = version;
        this.replicas = 1; // Default
        this.status = DeploymentStatus.IN_PROGRESS;
        this.deployedAt = Instant.now();
        this.stages = new ArrayList<>();
    }
}
