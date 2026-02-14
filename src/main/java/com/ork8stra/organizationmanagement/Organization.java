package com.ork8stra.organizationmanagement;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "organizations")
@Getter
@Setter
@NoArgsConstructor
public class Organization {

    @Id
    private UUID id;
    private String name;
    private String slug;
    private String ownerId;
    private Instant createdAt;

    public Organization(String name, String slug, String ownerId) {
        this.id = UUID.randomUUID();
        this.name = name;
        this.slug = slug;
        this.ownerId = ownerId;
        this.createdAt = Instant.now();
    }
}
