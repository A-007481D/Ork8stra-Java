package com.ork8stra.api.dto;

import com.ork8stra.organizationmanagement.OrgRole;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class UserIdentityResponse {
    private UUID id;
    private String username;
    private String email;
    private Instant createdAt;
    private boolean enabled;
    private List<OrganizationMembership> memberships;

    @Data
    @Builder
    public static class OrganizationMembership {
        private UUID organizationId;
        private String organizationName;
        private OrgRole role;
    }
}
