package com.ork8stra.organizationmanagement;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrgInvitationRepository extends JpaRepository<OrgInvitation, UUID> {
    Optional<OrgInvitation> findByToken(String token);
    Optional<OrgInvitation> findByEmailAndOrganizationIdAndStatus(String email, UUID organizationId, OrgInvitation.InvitationStatus status);
    List<OrgInvitation> findByOrganizationId(UUID organizationId);
    List<OrgInvitation> findByEmailAndStatus(String email, OrgInvitation.InvitationStatus status);
}
