package com.ork8stra.infrastructure.persistence;

import com.ork8stra.domain.model.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, UUID> {
    Optional<Organization> findBySlug(String slug);

    boolean existsByName(String name);

    boolean existsBySlug(String slug);
}
