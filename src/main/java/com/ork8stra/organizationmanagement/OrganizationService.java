package com.ork8stra.organizationmanagement;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final OrgMemberRepository orgMemberRepository;
    private final OrgInvitationRepository orgInvitationRepository;
    private final com.ork8stra.audit.AuditLogRepository auditLogRepository;
    private final com.ork8stra.user.UserRepository userRepository;

    @Transactional
    public Organization createOrganization(String name, UUID ownerId) {
        String slug = name.toLowerCase().replaceAll("[^a-z0-9]", "-").replaceAll("-+", "-");

        if (organizationRepository.findBySlug(slug).isPresent()) {
            slug = slug + "-" + UUID.randomUUID().toString().substring(0, 4);
        }

        Organization org = new Organization(name, slug, ownerId);
        Organization savedOrg = organizationRepository.save(org);

        // Auto-create owner membership
        OrgMember member = OrgMember.builder()
                .userId(ownerId)
                .organizationId(savedOrg.getId())
                .role(OrgRole.ORG_OWNER)
                .build();
        orgMemberRepository.save(member);

        // Record Audit Log
        String username = userRepository.findById(ownerId).map(com.ork8stra.user.User::getUsername).orElse("System");
        auditLogRepository.save(com.ork8stra.audit.AuditLog.builder()
                .userId(ownerId)
                .username(username)
                .organizationId(savedOrg.getId())
                .action("ORG_CREATED")
                .targetName(name)
                .build());

        return savedOrg;
    }

    public List<Organization> getOrganizationsByOwner(UUID ownerId) {
        return organizationRepository.findByOwnerId(ownerId);
    }

    public Organization getOrganization(UUID organizationId) {
        return organizationRepository.findById(organizationId)
                .orElseThrow(() -> new IllegalArgumentException("Organization not found: " + organizationId));
    }

    public List<OrgMember> getMembers(UUID organizationId) {
        return orgMemberRepository.findByOrganizationId(organizationId);
    }

    public List<OrgInvitation> getInvitations(UUID organizationId) {
        return orgInvitationRepository.findByOrganizationId(organizationId);
    }

    @Transactional
    public OrgMember addMember(UUID organizationId, UUID userId, OrgRole role) {
        if (orgMemberRepository.existsByUserIdAndOrganizationId(userId, organizationId)) {
            throw new IllegalArgumentException("User is already a member of this organization");
        }
        OrgMember member = OrgMember.builder()
                .userId(userId)
                .organizationId(organizationId)
                .role(role)
                .build();
        OrgMember savedMember = orgMemberRepository.save(member);

        // Record Audit Log
        String username = userRepository.findById(userId).map(com.ork8stra.user.User::getUsername).orElse("Unknown");
        auditLogRepository.save(com.ork8stra.audit.AuditLog.builder()
                .userId(userId)
                .username(username)
                .organizationId(organizationId)
                .action("MEMBER_ADDED")
                .targetName(username)
                .details("Role: " + role)
                .build());

        return savedMember;
    }

    @Transactional
    public void removeMember(UUID organizationId, UUID userId) {
        OrgMember member = orgMemberRepository.findByUserIdAndOrganizationId(userId, organizationId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found"));
        
        if (member.getRole() == OrgRole.ORG_OWNER) {
            throw new IllegalArgumentException("Cannot remove organization owner");
        }
        
        orgMemberRepository.deleteByUserIdAndOrganizationId(userId, organizationId);

        // Record Audit Log
        String username = userRepository.findById(userId).map(com.ork8stra.user.User::getUsername).orElse("Unknown");
        auditLogRepository.save(com.ork8stra.audit.AuditLog.builder()
                .userId(userId)
                .username(username)
                .organizationId(organizationId)
                .action("MEMBER_REMOVED")
                .targetName(username)
                .build());
    }

    @Transactional
    public void deleteOrganization(UUID organizationId) {
        Organization org = getOrganization(organizationId);
        organizationRepository.delete(org);
    }

    @Transactional
    public OrgInvitation inviteUser(UUID orgId, String email, OrgRole role) {
        // Check if already a member
        userRepository.findByEmailIgnoreCase(email).ifPresent(user -> {
            if (orgMemberRepository.existsByUserIdAndOrganizationId(user.getId(), orgId)) {
                throw new IllegalArgumentException("User is already a member of this organization");
            }
        });

        // Revoke any existing pending invites for this email in this org
        orgInvitationRepository.findByEmailAndOrganizationIdAndStatus(email, orgId, OrgInvitation.InvitationStatus.PENDING)
                .ifPresent(inv -> {
                    inv.setStatus(OrgInvitation.InvitationStatus.REVOKED);
                    orgInvitationRepository.save(inv);
                });

        OrgInvitation invitation = OrgInvitation.builder()
                .organizationId(orgId)
                .email(email.toLowerCase())
                .role(role)
                .token(UUID.randomUUID().toString())
                .status(OrgInvitation.InvitationStatus.PENDING)
                .build();
        
        OrgInvitation savedInvitation = orgInvitationRepository.save(invitation);

        // Record Audit Log (Optional, but good for tracking)
        auditLogRepository.save(com.ork8stra.audit.AuditLog.builder()
                .userId(java.util.UUID.fromString("00000000-0000-0000-0000-000000000000")) // System/Admin action
                .username("System")
                .organizationId(orgId)
                .action("INVITATION_SENT")
                .targetName(email)
                .details("Role: " + role)
                .build());
        
        return savedInvitation;
    }

    @Transactional
    public OrgInvitation requestToJoin(UUID orgId, String email) {
        // Check if already a member
        userRepository.findByEmailIgnoreCase(email).ifPresent(user -> {
            if (orgMemberRepository.existsByUserIdAndOrganizationId(user.getId(), orgId)) {
                throw new IllegalArgumentException("You are already a member of this organization");
            }
        });

        OrgInvitation invitation = OrgInvitation.builder()
                .organizationId(orgId)
                .email(email.toLowerCase())
                .role(OrgRole.ORG_MEMBER) // Default role for requests
                .token(UUID.randomUUID().toString())
                .status(OrgInvitation.InvitationStatus.PENDING_APPROVAL)
                .build();
        
        OrgInvitation saved = orgInvitationRepository.save(invitation);

        auditLogRepository.save(com.ork8stra.audit.AuditLog.builder()
                .userId(java.util.UUID.fromString("00000000-0000-0000-0000-000000000000"))
                .username("System")
                .organizationId(orgId)
                .action("INVITATION_REQUESTED")
                .targetName(email)
                .build());

        return saved;
    }

    @Transactional
    public OrgInvitation approveInvitation(UUID invitationId) {
        OrgInvitation invitation = orgInvitationRepository.findById(invitationId)
                .orElseThrow(() -> new IllegalArgumentException("Invitation not found"));

        if (invitation.getStatus() != OrgInvitation.InvitationStatus.PENDING_APPROVAL) {
            throw new IllegalStateException("Invitation is not pending approval");
        }

        invitation.setStatus(OrgInvitation.InvitationStatus.PENDING);
        OrgInvitation saved = orgInvitationRepository.save(invitation);

        auditLogRepository.save(com.ork8stra.audit.AuditLog.builder()
                .userId(java.util.UUID.fromString("00000000-0000-0000-0000-000000000000"))
                .username("System")
                .organizationId(invitation.getOrganizationId())
                .action("INVITATION_APPROVED")
                .targetName(invitation.getEmail())
                .build());

        return saved;
    }

    @Transactional
    public void rejectInvitation(UUID invitationId) {
        OrgInvitation invitation = orgInvitationRepository.findById(invitationId)
                .orElseThrow(() -> new IllegalArgumentException("Invitation not found"));

        invitation.setStatus(OrgInvitation.InvitationStatus.REVOKED);
        orgInvitationRepository.save(invitation);

        auditLogRepository.save(com.ork8stra.audit.AuditLog.builder()
                .userId(java.util.UUID.fromString("00000000-0000-0000-0000-000000000000"))
                .username("System")
                .organizationId(invitation.getOrganizationId())
                .action("INVITATION_REJECTED")
                .targetName(invitation.getEmail())
                .build());
    }

    @Transactional
    public OrgInvitation generateJoinLink(UUID orgId, OrgRole role) {
        OrgInvitation invitation = OrgInvitation.builder()
                .organizationId(orgId)
                .role(role)
                .token(UUID.randomUUID().toString())
                .status(OrgInvitation.InvitationStatus.PENDING)
                .build();
        return orgInvitationRepository.save(invitation);
    }

    @Transactional
    public Organization acceptInvitation(String token, UUID userId) {
        OrgInvitation invitation = orgInvitationRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid invitation token"));

        if (invitation.getStatus() != OrgInvitation.InvitationStatus.PENDING) {
            throw new IllegalArgumentException("Invitation is no longer valid");
        }

        if (invitation.getExpiresAt().isBefore(java.time.Instant.now())) {
            invitation.setStatus(OrgInvitation.InvitationStatus.EXPIRED);
            orgInvitationRepository.save(invitation);
            throw new IllegalArgumentException("Invitation has expired");
        }

        // Create membership
        addMember(invitation.getOrganizationId(), userId, invitation.getRole());

        // Update invitation status
        invitation.setStatus(OrgInvitation.InvitationStatus.ACCEPTED);
        orgInvitationRepository.save(invitation);

        return getOrganization(invitation.getOrganizationId());
    }

    @Transactional
    public void autoJoinInvitedUser(String email, UUID userId) {
        List<OrgInvitation> pendingInvites = orgInvitationRepository.findByEmailAndStatus(email.toLowerCase(), OrgInvitation.InvitationStatus.PENDING);
        for (OrgInvitation invite : pendingInvites) {
            if (invite.getExpiresAt().isAfter(java.time.Instant.now())) {
                addMember(invite.getOrganizationId(), userId, invite.getRole());
                invite.setStatus(OrgInvitation.InvitationStatus.ACCEPTED);
                orgInvitationRepository.save(invite);
            }
        }
    }
}
