package com.ork8stra.organizationmanagement;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrganizationRepository extends JpaRepository<Organization, UUID> {
    List<Organization> findByOwnerId(String ownerId);

    Optional<Organization> findBySlug(String slug);
}
