package com.ork8stra.api.controller;

import com.ork8stra.api.dto.IAMSummaryResponse;
import com.ork8stra.api.dto.UserIdentityResponse;
import com.ork8stra.audit.AuditLogRepository;
import com.ork8stra.organizationmanagement.*;
import com.ork8stra.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/iam")
@RequiredArgsConstructor
public class IAMController {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final OrgPolicyRepository orgPolicyRepository;
    private final OrgInvitationRepository orgInvitationRepository;
    private final OrgMemberRepository orgMemberRepository;
    private final AuditLogRepository auditLogRepository;
    private final com.ork8stra.teammanagement.TeamRepository teamRepository;

    @GetMapping("/summary")
    @PreAuthorize("hasRole('ADMIN')")
 // Only global admins can see the full IAM summary
    public ResponseEntity<IAMSummaryResponse> getSummary() {
        return ResponseEntity.ok(IAMSummaryResponse.builder()
                .totalUsers(userRepository.count())
                .activeOrganizations(organizationRepository.count())
                .totalPolicies(orgPolicyRepository.count())
                .pendingInvitations(orgInvitationRepository.countByStatus(OrgInvitation.InvitationStatus.PENDING))
                .auditLogCount(auditLogRepository.count())
                .build());
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserIdentityResponse>> listUsers() {
        List<UserIdentityResponse> users = userRepository.findAll().stream()
                .map(user -> {
                    List<OrgMember> memberships = orgMemberRepository.findByUserId(user.getId());
                    
                    List<UserIdentityResponse.OrganizationMembership> orgMemberships = memberships.stream()
                            .map(m -> {
                                Organization org = organizationRepository.findById(m.getOrganizationId()).orElse(null);
                                return UserIdentityResponse.OrganizationMembership.builder()
                                        .organizationId(m.getOrganizationId())
                                        .organizationName(org != null ? org.getName() : "Unknown")
                                        .role(m.getRole())
                                        .build();
                            })
                            .collect(Collectors.toList());

                    return UserIdentityResponse.builder()
                            .id(user.getId())
                            .username(user.getUsername())
                            .email(user.getEmail())
                            .createdAt(user.getCreatedAt())
                            .enabled(user.isEnabled())
                            .memberships(orgMemberships)
                            .build();
                })
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(users);
    }


    @GetMapping("/debug-me")
    public ResponseEntity<?> debugMe(org.springframework.security.core.Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).body("Not authenticated");
        return ResponseEntity.ok(java.util.Map.of(
            "username", auth.getName(),
            "authorities", auth.getAuthorities().stream().map(Object::toString).toList(),
            "details", auth.getDetails().toString()
        ));
    }

    @GetMapping("/policies")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<OrgPolicy>> listGlobalPolicies() {
        return ResponseEntity.ok(orgPolicyRepository.findAll());
    }

    @GetMapping("/audit-logs")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<com.ork8stra.audit.AuditLog>> listAuditLogs() {
        return ResponseEntity.ok(auditLogRepository.findAllByOrderByCreatedAtDesc());
    }

    @GetMapping("/teams")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<com.ork8stra.teammanagement.Team>> listAllTeams() {
        return ResponseEntity.ok(teamRepository.findAll());
    }

    @GetMapping("/invitations")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<OrgInvitation>> listAllInvitations() {
        return ResponseEntity.ok(orgInvitationRepository.findAll());
    }
}
