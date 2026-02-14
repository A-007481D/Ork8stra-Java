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

    @Transactional
    public Organization createOrganization(String name, String ownerId) {
        String slug = name.toLowerCase().replaceAll("[^a-z0-9]", "-").replaceAll("-+", "-");

        if (organizationRepository.findBySlug(slug).isPresent()) {
            slug = slug + "-" + UUID.randomUUID().toString().substring(0, 4);
        }

        Organization org = new Organization(name, slug, ownerId);
        return organizationRepository.save(org);
    }

    public List<Organization> getOrganizationsByOwner(String ownerId) {
        return organizationRepository.findByOwnerId(ownerId);
    }

    public Organization getOrganization(UUID organizationId) {
        return organizationRepository.findById(organizationId)
                .orElseThrow(() -> new IllegalArgumentException("Organization not found: " + organizationId));
    }
}
