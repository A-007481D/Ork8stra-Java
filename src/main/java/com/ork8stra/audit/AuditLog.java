package com.ork8stra.audit;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "audit_log")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID userId;

    private String username;

    @Column(nullable = false)
    private UUID organizationId;

    @Column(nullable = false)
    private String action; // e.g., MEMBER_ADDED, PROJECT_CREATED, DEPLOYMENT_STARTED

    private String targetName;

    @Column(columnDefinition = "TEXT")
    private String details; // Any JSON or flat string details

    @Builder.Default
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
