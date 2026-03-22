package com.ork8stra.api.dto;

import com.ork8stra.organizationmanagement.OrgRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrgMemberResponse {
    private String id;
    private String userId;
    private String username;
    private String email;
    private OrgRole role;
    private Instant joinedAt;
}
