package com.ork8stra.buildengine;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "builds")
@Getter
@Setter
@NoArgsConstructor
public class Build {

    @Id
    private UUID id;
    private UUID applicationId;
    private String commitHash;

    @Enumerated(EnumType.STRING)
    private BuildStatus status;

    private String imageTag;
    private String jobName;
    private Instant startTime;
    private Instant endTime;

    public Build(UUID applicationId, String commitHash) {
        this.id = UUID.randomUUID();
        this.applicationId = applicationId;
        this.commitHash = commitHash;
        this.status = BuildStatus.PENDING;
        this.startTime = Instant.now();
    }
}
