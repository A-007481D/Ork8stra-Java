package com.ork8stra.application;

import com.ork8stra.api.dto.CreateOrganizationRequest;
import com.ork8stra.api.dto.OrganizationResponse;
import com.ork8stra.domain.model.Organization;
import com.ork8stra.domain.model.OrganizationMember;
import com.ork8stra.domain.model.OrganizationRole;
import com.ork8stra.user.User;
import com.ork8stra.infrastructure.persistence.OrganizationMemberRepository;
import com.ork8stra.infrastructure.persistence.OrganizationRepository;
import com.ork8stra.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository memberRepository;
    private final UserRepository userRepository;

    @Transactional
    public OrganizationResponse createOrganization(CreateOrganizationRequest request) {
        String username = getAuthenticatedUsername();
        User owner = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        if (organizationRepository.existsByName(request.getName())) {
            throw new RuntimeException("Organization name already taken");
        }

        String slug = request.getName().toLowerCase().replaceAll("[^a-z0-9-]", "-");

        Organization organization = Organization.builder()
                .name(request.getName())
                .slug(slug)
                .owner(owner)
                .build();

        organization = organizationRepository.save(organization);

        OrganizationMember member = OrganizationMember.builder()
                .organization(organization)
                .user(owner)
                .role(OrganizationRole.ADMIN)
                .build();

        memberRepository.save(member);

        return mapToResponse(organization);
    }

    public List<OrganizationResponse> getMyOrganizations() {
        String username = getAuthenticatedUsername();
        User user = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return memberRepository.findByUserId(user.getId()).stream()
                .map(member -> mapToResponse(member.getOrganization()))
                .collect(Collectors.toList());
    }

    private OrganizationResponse mapToResponse(Organization org) {
        return OrganizationResponse.builder()
                .id(org.getId())
                .name(org.getName())
                .slug(org.getSlug())
                .ownerId(org.getOwner().getId())
                .createdAt(org.getCreatedAt())
                .build();
    }

    private String getAuthenticatedUsername() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetails) {
            return ((UserDetails) principal).getUsername();
        }
        return principal.toString();
    }
}
