package com.ork8stra.applicationmanagement;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "service_connections")
@Getter
@Setter
@NoArgsConstructor
public class ServiceConnection {

    @Id
    private UUID id;

    @Column(name = "source_app_id", nullable = false)
    private UUID sourceAppId;

    @Column(name = "target_app_id", nullable = false)
    private UUID targetAppId;

    @Column(name = "metadata")
    private String metadata; // Can store UI-specific info like ReactFlow handle IDs

    public ServiceConnection(UUID sourceAppId, UUID targetAppId) {
        this.id = UUID.randomUUID();
        this.sourceAppId = sourceAppId;
        this.targetAppId = targetAppId;
    }
}
