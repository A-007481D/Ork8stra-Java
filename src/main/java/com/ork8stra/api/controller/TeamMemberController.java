package com.ork8stra.api.controller;

import com.ork8stra.api.dto.TeamMemberResponse;
import com.ork8stra.teammanagement.TeamMember;
import com.ork8stra.teammanagement.TeamService;
import com.ork8stra.user.User;
import com.ork8stra.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/teams/{teamId}/members")
@RequiredArgsConstructor
public class TeamMemberController {

    private final TeamService teamService;
    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("@rbacService.hasTeamAccess(#teamId)")
    public ResponseEntity<List<TeamMemberResponse>> listMembers(@PathVariable UUID teamId) {
        List<TeamMemberResponse> members = teamService.getTeamMembers(teamId).stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(members);
    }

    @PostMapping
    @PreAuthorize("@rbacService.hasTeamAccess(#teamId)")
    public ResponseEntity<TeamMemberResponse> addMember(
            @PathVariable UUID teamId,
            @RequestParam String email,
            @RequestParam String role) {
        
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("User with email " + email + " not found"));
        
        TeamMember member = teamService.addTeamMember(teamId, user.getId(), role);
        return ResponseEntity.ok(toResponse(member));
    }

    @DeleteMapping("/{userId}")
    @PreAuthorize("@rbacService.hasTeamAccess(#teamId)")
    public ResponseEntity<Void> removeMember(
            @PathVariable UUID teamId,
            @PathVariable UUID userId) {
        teamService.removeTeamMember(teamId, userId);
        return ResponseEntity.noContent().build();
    }

    private TeamMemberResponse toResponse(TeamMember member) {
        User user = userRepository.findById(member.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        return TeamMemberResponse.builder()
                .id(member.getId().toString())
                .userId(member.getUserId().toString())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(member.getRole())
                .joinedAt(member.getJoinedAt())
                .build();
    }
}
