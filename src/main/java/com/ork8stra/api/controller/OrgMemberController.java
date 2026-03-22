package com.ork8stra.api.controller;

import com.ork8stra.api.dto.OrgMemberResponse;
import com.ork8stra.organizationmanagement.OrgInvitation;
import com.ork8stra.organizationmanagement.OrgMember;
import com.ork8stra.organizationmanagement.OrgRole;
import com.ork8stra.organizationmanagement.OrganizationService;
import com.ork8stra.user.User;
import com.ork8stra.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orgs/{orgId}/members")
@RequiredArgsConstructor
public class OrgMemberController {

    private final OrganizationService organizationService;
    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("@rbacService.hasOrgRole(#orgId, 'VIEWER')")
    public ResponseEntity<List<OrgMemberResponse>> listMembers(@PathVariable UUID orgId) {
        List<OrgMemberResponse> members = organizationService.getMembers(orgId).stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(members);
    }

    @PostMapping
    @PreAuthorize("@rbacService.hasOrgRole(#orgId, 'ADMIN')")
    public ResponseEntity<?> addMember(
            @PathVariable UUID orgId,
            @RequestParam String email,
            @RequestParam OrgRole role) {
        
        try {
            User user = userRepository.findByEmailIgnoreCase(email)
                    .orElse(null);
            
            if (user == null) {
                // User doesn't exist, create a pending invitation
                OrgInvitation invitation = organizationService.inviteUser(orgId, email, role);
                return ResponseEntity.ok(invitation);
            }
            
            OrgMember member = organizationService.addMember(orgId, user.getId(), role);
            return ResponseEntity.ok(toResponse(member));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/invite-link")
    @PreAuthorize("@rbacService.hasOrgRole(#orgId, 'ADMIN')")
    public ResponseEntity<OrgInvitation> generateJoinLink(
            @PathVariable UUID orgId,
            @RequestParam OrgRole role) {
        return ResponseEntity.ok(organizationService.generateJoinLink(orgId, role));
    }

    @GetMapping("/invitations")
    @PreAuthorize("@rbacService.hasOrgRole(#orgId, 'VIEWER')")
    public ResponseEntity<List<OrgInvitation>> listInvitations(@PathVariable UUID orgId) {
        // This is a bit lazy, should probably have a separate InvitationsRepository call here or in service
        // But for now, let's assume OrganizationService has a listInvitations method
        return ResponseEntity.ok(organizationService.getInvitations(orgId));
    }

    @DeleteMapping("/{userId}")
    @PreAuthorize("@rbacService.hasOrgRole(#orgId, 'ADMIN')")
    public ResponseEntity<Void> removeMember(
            @PathVariable UUID orgId,
            @PathVariable UUID userId) {
        organizationService.removeMember(orgId, userId);
        return ResponseEntity.noContent().build();
    }

    private OrgMemberResponse toResponse(OrgMember member) {
        User user = userRepository.findById(member.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        return OrgMemberResponse.builder()
                .id(member.getId().toString())
                .userId(member.getUserId().toString())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(member.getRole())
                .joinedAt(member.getJoinedAt())
                .build();
    }
}
