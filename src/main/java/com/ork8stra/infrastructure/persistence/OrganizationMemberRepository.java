package com.ork8stra.infrastructure.persistence;

import com.ork8stra.domain.model.OrganizationMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrganizationMemberRepository extends JpaRepository<OrganizationMember, UUID> {
    List<OrganizationMember> findByUserId(UUID userId);

    Optional<OrganizationMember> findByUserIdAndOrganizationId(UUID userId, UUID organizationId);
}
