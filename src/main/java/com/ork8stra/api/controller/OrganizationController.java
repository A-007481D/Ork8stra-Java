package com.ork8stra.api.controller;

import com.ork8stra.api.dto.CreateOrganizationRequest;
import com.ork8stra.api.dto.OrganizationResponse;
import com.ork8stra.organizationmanagement.Organization;
import com.ork8stra.organizationmanagement.OrganizationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orgs")
@RequiredArgsConstructor
public class OrganizationController {
    private final OrganizationService organizationService;
    private final com.ork8stra.user.UserRepository userRepository;

    @PostMapping
    public ResponseEntity<OrganizationResponse> createOrganization(
            @Valid @RequestBody CreateOrganizationRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        com.ork8stra.user.User user = userRepository.findByUsernameIgnoreCase(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Organization org = organizationService.createOrganization(request.getName(), user.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(org));
    }

    @GetMapping
    public ResponseEntity<List<OrganizationResponse>> getMyOrganizations(
            @AuthenticationPrincipal UserDetails userDetails) {

        com.ork8stra.user.User user = userRepository.findByUsernameIgnoreCase(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<OrganizationResponse> responses = organizationService.getOrganizationsByOwner(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();

        return ResponseEntity.ok(responses);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrganization(@PathVariable UUID id) {
        organizationService.deleteOrganization(id);
        return ResponseEntity.noContent().build();
    }

    private OrganizationResponse toResponse(Organization org) {
        return OrganizationResponse.builder()
                .id(org.getId())
                .name(org.getName())
                .slug(org.getSlug())
                .build();
    }
}
