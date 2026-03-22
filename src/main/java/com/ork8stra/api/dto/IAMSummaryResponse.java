package com.ork8stra.api.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class IAMSummaryResponse {
    private long totalUsers;
    private long activeOrganizations;
    private long totalPolicies;
    private long pendingInvitations;
    private long auditLogCount;
}
