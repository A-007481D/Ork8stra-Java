package com.ork8stra.api.controller;

import com.ork8stra.organizationmanagement.OrgInvitation;
import com.ork8stra.organizationmanagement.OrgRole;
import com.ork8stra.organizationmanagement.OrganizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/organizations/{orgId}/invitations")
@RequiredArgsConstructor
public class OrgInvitationController {

    private final OrganizationService organizationService;

    @GetMapping
    @PreAuthorize("@rbacService.hasOrgRole(#orgId, 'ORG_ADMIN', 'ORG_OWNER')")
    public ResponseEntity<List<OrgInvitation>> listInvitations(@PathVariable UUID orgId) {
        return ResponseEntity.ok(organizationService.getInvitations(orgId));
    }

    @PostMapping("/link")
    @PreAuthorize("@rbacService.hasOrgRole(#orgId, 'ORG_ADMIN', 'ORG_OWNER')")
    public ResponseEntity<OrgInvitation> generateJoinLink(
            @PathVariable UUID orgId,
            @RequestParam(defaultValue = "ORG_MEMBER") OrgRole role) {
        return ResponseEntity.ok(organizationService.generateJoinLink(orgId, role));
    }

    @PostMapping
    @PreAuthorize("@rbacService.hasOrgRole(#orgId, 'ORG_ADMIN', 'ORG_OWNER')")
    public ResponseEntity<OrgInvitation> inviteUser(
            @PathVariable UUID orgId,
            @RequestParam String email,
            @RequestParam(defaultValue = "ORG_MEMBER") OrgRole role) {
        return ResponseEntity.ok(organizationService.inviteUser(orgId, email, role));
    }

    @PostMapping("/{invitationId}/approve")
    @PreAuthorize("@rbacService.hasOrgRole(#orgId, 'ORG_ADMIN', 'ORG_OWNER')")
    public ResponseEntity<OrgInvitation> approveInvitation(
            @PathVariable UUID orgId,
            @PathVariable UUID invitationId) {
        return ResponseEntity.ok(organizationService.approveInvitation(invitationId));
    }

    @PostMapping("/{invitationId}/reject")
    @PreAuthorize("@rbacService.hasOrgRole(#orgId, 'ORG_ADMIN', 'ORG_OWNER')")
    public ResponseEntity<Void> rejectInvitation(
            @PathVariable UUID orgId,
            @PathVariable UUID invitationId) {
        organizationService.rejectInvitation(invitationId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/request")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<OrgInvitation> requestToJoin(
            @PathVariable UUID orgId,
            @RequestParam String email) {
        return ResponseEntity.ok(organizationService.requestToJoin(orgId, email));
    }
}
