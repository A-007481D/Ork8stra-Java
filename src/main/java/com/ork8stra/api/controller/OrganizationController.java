package com.ork8stra.api.controller;

import com.ork8stra.api.dto.CreateOrganizationRequest;
import com.ork8stra.api.dto.OrganizationResponse;
import com.ork8stra.application.OrganizationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/orgs")
@RequiredArgsConstructor
public class OrganizationController {

    private final OrganizationService organizationService;

    @PostMapping
    public ResponseEntity<OrganizationResponse> createOrganization(
            @Valid @RequestBody CreateOrganizationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(organizationService.createOrganization(request));
    }

    @GetMapping
    public ResponseEntity<List<OrganizationResponse>> getMyOrganizations() {
        return ResponseEntity.ok(organizationService.getMyOrganizations());
    }
}
