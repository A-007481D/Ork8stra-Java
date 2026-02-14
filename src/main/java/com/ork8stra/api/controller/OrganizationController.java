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

@RestController
@RequestMapping("/api/v1/orgs")
@RequiredArgsConstructor
public class OrganizationController {

    private final OrganizationService organizationService;

    @PostMapping
    public ResponseEntity<OrganizationResponse> createOrganization(
            @Valid @RequestBody CreateOrganizationRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        Organization org = organizationService.createOrganization(request.getName(), userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(org));
    }

    @GetMapping
    public ResponseEntity<List<OrganizationResponse>> getMyOrganizations(
            @AuthenticationPrincipal UserDetails userDetails) {

        List<OrganizationResponse> responses = organizationService.getOrganizationsByOwner(userDetails.getUsername())
                .stream()
                .map(this::toResponse)
                .toList();

        return ResponseEntity.ok(responses);
    }

    private OrganizationResponse toResponse(Organization org) {
        return OrganizationResponse.builder()
                .id(org.getId())
                .name(org.getName())
                .slug(org.getSlug())
                .build();
    }
}
