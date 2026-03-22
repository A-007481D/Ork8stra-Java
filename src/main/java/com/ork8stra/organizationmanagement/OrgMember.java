package com.ork8stra.organizationmanagement;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Join table representing a User's membership in an Organization.
 * Each record binds a user to an org with a specific scoped role.
 */
@Entity
@Table(name = "org_members", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "organization_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrgMember {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrgRole role;

    @Builder.Default
    @Column(name = "joined_at", nullable = false, updatable = false)
    private Instant joinedAt = Instant.now();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "org_member_policies", joinColumns = @JoinColumn(name = "member_id"))
    @Column(name = "policy_id")
    @Builder.Default
    private List<UUID> policyIds = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (joinedAt == null) joinedAt = Instant.now();
        if (policyIds == null) policyIds = new java.util.ArrayList<>();
    }
}
