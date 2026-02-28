package com.ork8stra.applicationmanagement;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "applications")
@Getter
@Setter
@NoArgsConstructor
public class Application {

    @Id
    private UUID id;
    private String name;
    private UUID projectId;
    private String gitRepoUrl;
    private String buildBranch;
    private String dockerfilePath;

    @ElementCollection
    @CollectionTable(name = "application_env_vars", joinColumns = @JoinColumn(name = "application_id"))
    @MapKeyColumn(name = "env_key")
    @Column(name = "env_value")
    private Map<String, String> envVars = new HashMap<>();

    public Application(String name, UUID projectId, String gitRepoUrl, String buildBranch) {
        this.id = UUID.randomUUID();
        this.name = name;
        this.projectId = projectId;
        this.gitRepoUrl = gitRepoUrl;
        this.buildBranch = buildBranch;
    }
}
