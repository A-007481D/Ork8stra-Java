package com.ork8stra.organizationmanagement;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrgMemberRepository extends JpaRepository<OrgMember, UUID> {

    List<OrgMember> findByOrganizationId(UUID organizationId);

    List<OrgMember> findByUserId(UUID userId);

    Optional<OrgMember> findByUserIdAndOrganizationId(UUID userId, UUID organizationId);

    boolean existsByUserIdAndOrganizationId(UUID userId, UUID organizationId);

    void deleteByUserIdAndOrganizationId(UUID userId, UUID organizationId);
}
