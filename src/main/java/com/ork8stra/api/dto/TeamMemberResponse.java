package com.ork8stra.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamMemberResponse {
    private String id;
    private String userId;
    private String username;
    private String email;
    private String role; // "lead", "member", "viewer"
    private Instant joinedAt;
}
