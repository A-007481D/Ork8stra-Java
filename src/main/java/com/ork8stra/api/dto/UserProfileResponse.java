package com.ork8stra.api.dto;

import com.ork8stra.user.PlatformRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private String id;
    private String username;
    private String email;
    private String displayName;
    private String avatarUrl;
    private Set<PlatformRole> roles;
    private Instant createdAt;
    private List<OrgMembershipDto> organizations;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrgMembershipDto {
        private String id;
        private String name;
        private String slug;
        private String role;
    }
}
