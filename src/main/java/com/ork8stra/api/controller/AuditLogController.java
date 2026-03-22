package com.ork8stra.api.controller;

import com.ork8stra.api.dto.AuditLogResponse;
import com.ork8stra.audit.AuditLog;
import com.ork8stra.audit.AuditLogRepository;
import com.ork8stra.auth.security.RbacService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orgs/{orgId}/audit")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;

    @GetMapping
    @PreAuthorize("@rbacService.hasOrgRole(#orgId, 'VIEWER')")
    public ResponseEntity<List<AuditLogResponse>> getAuditLogs(@PathVariable UUID orgId) {
        List<AuditLogResponse> logs = auditLogRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId)
                .stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(logs);
    }

    private AuditLogResponse toResponse(AuditLog log) {
        return AuditLogResponse.builder()
                .id(log.getId().toString())
                .userId(log.getUserId().toString())
                .username(log.getUsername())
                .action(log.getAction())
                .targetName(log.getTargetName())
                .details(log.getDetails())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
