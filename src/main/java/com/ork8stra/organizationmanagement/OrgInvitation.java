package com.ork8stra.organizationmanagement;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Represents a pending invitation to join an Organization.
 * Can be email-specific or token-based (for a join link).
 */
@Entity
@Table(name = "org_invitations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrgInvitation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(nullable = true)
    private String email;

    @Column(nullable = false)
    private String token;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrgRole role;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvitationStatus status = InvitationStatus.PENDING;

    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Builder.Default
    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt = Instant.now().plus(java.time.Duration.ofDays(7));

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
        if (status == null) status = InvitationStatus.PENDING;
        if (expiresAt == null) expiresAt = Instant.now().plus(java.time.Duration.ofDays(7));
    }

    public enum InvitationStatus {
        PENDING,
        PENDING_APPROVAL,
        ACCEPTED,
        EXPIRED,
        REVOKED
    }
}
