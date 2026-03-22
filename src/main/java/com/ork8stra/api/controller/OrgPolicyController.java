package com.ork8stra.api.controller;

import com.ork8stra.organizationmanagement.OrgPolicy;
import com.ork8stra.organizationmanagement.OrgPolicyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orgs/{orgId}/policies")
@RequiredArgsConstructor
public class OrgPolicyController {

    private final OrgPolicyRepository orgPolicyRepository;

    @GetMapping
    @PreAuthorize("@rbacService.hasOrgRole(#orgId, 'VIEWER')")
    public ResponseEntity<List<OrgPolicy>> listPolicies(@PathVariable UUID orgId) {
        return ResponseEntity.ok(orgPolicyRepository.findByOrganizationId(orgId));
    }

    @PostMapping
    @PreAuthorize("@rbacService.hasOrgRole(#orgId, 'ADMIN')")
    public ResponseEntity<OrgPolicy> createPolicy(
            @PathVariable UUID orgId,
            @RequestBody OrgPolicy policy) {
        policy.setOrganizationId(orgId);
        return ResponseEntity.ok(orgPolicyRepository.save(policy));
    }

    @DeleteMapping("/{policyId}")
    @PreAuthorize("@rbacService.hasOrgRole(#orgId, 'ADMIN')")
    public ResponseEntity<Void> deletePolicy(
            @PathVariable UUID orgId,
            @PathVariable UUID policyId) {
        orgPolicyRepository.deleteById(policyId);
        return ResponseEntity.noContent().build();
    }
}
