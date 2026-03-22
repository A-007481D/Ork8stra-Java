package com.ork8stra.api.controller;

import com.ork8stra.api.dto.UserProfileResponse;
import com.ork8stra.organizationmanagement.OrgMember;
import com.ork8stra.organizationmanagement.OrgMemberRepository;
import com.ork8stra.organizationmanagement.Organization;
import com.ork8stra.organizationmanagement.OrganizationRepository;
import com.ork8stra.user.User;
import com.ork8stra.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserRepository userRepository;
    private final OrgMemberRepository orgMemberRepository;
    private final OrganizationRepository organizationRepository;

    @GetMapping
    public ResponseEntity<UserProfileResponse> getProfile(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsernameIgnoreCase(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        List<OrgMember> memberships = orgMemberRepository.findByUserId(user.getId());
        
        List<UserProfileResponse.OrgMembershipDto> orgDtos = memberships.stream()
                .map(m -> {
                    Organization org = organizationRepository.findById(m.getOrganizationId())
                            .orElseThrow(() -> new IllegalArgumentException("Org not found"));
                    return UserProfileResponse.OrgMembershipDto.builder()
                            .id(org.getId().toString())
                            .name(org.getName())
                            .slug(org.getSlug())
                            .role(m.getRole().name())
                            .build();
                })
                .toList();

        UserProfileResponse response = UserProfileResponse.builder()
                .id(user.getId().toString())
                .username(user.getUsername())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .roles(user.getRoles())
                .createdAt(user.getCreatedAt())
                .organizations(orgDtos)
                .build();
        
        return ResponseEntity.ok(response);
    }

    @PutMapping
    public ResponseEntity<UserProfileResponse> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody UserProfileUpdate update) {
        
        User user = userRepository.findByUsernameIgnoreCase(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        if (update.displayName() != null) user.setDisplayName(update.displayName());
        if (update.avatarUrl() != null) user.setAvatarUrl(update.avatarUrl());
        
        userRepository.save(user);
        return getProfile(userDetails);
    }

    public record UserProfileUpdate(String displayName, String avatarUrl) {}
}
