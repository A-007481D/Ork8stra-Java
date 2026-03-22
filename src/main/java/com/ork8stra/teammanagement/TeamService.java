package com.ork8stra.teammanagement;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final com.ork8stra.audit.AuditLogRepository auditLogRepository;
    private final com.ork8stra.user.UserRepository userRepository;

    @Transactional
    public Team createTeam(String name, UUID organizationId) {
        Team team = new Team(name, organizationId);
        return teamRepository.save(team);
    }

    public List<Team> getTeamsByOrganizationId(UUID organizationId) {
        return teamRepository.findByOrganizationId(organizationId);
    }

    public Team getTeamById(UUID id) {
        return teamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Team not found"));
    }

    public List<TeamMember> getTeamMembers(UUID teamId) {
        return teamMemberRepository.findByTeamId(teamId);
    }

    @Transactional
    public TeamMember addTeamMember(UUID teamId, UUID userId, String role) {
        if (teamMemberRepository.existsByUserIdAndTeamId(userId, teamId)) {
            throw new IllegalArgumentException("User is already a member of this team");
        }
        TeamMember member = TeamMember.builder()
                .userId(userId)
                .teamId(teamId)
                .role(role)
                .build();
        TeamMember savedMember = teamMemberRepository.save(member);

        // Record Audit Log
        String username = userRepository.findById(userId).map(com.ork8stra.user.User::getUsername).orElse("Unknown");
        Team team = getTeamById(teamId);
        auditLogRepository.save(com.ork8stra.audit.AuditLog.builder()
                .userId(userId)
                .username(username)
                .organizationId(team.getOrganizationId())
                .action("TEAM_MEMBER_ADDED")
                .targetName(team.getName())
                .details("Role: " + role)
                .build());

        return savedMember;
    }

    @Transactional
    public void removeTeamMember(UUID teamId, UUID userId) {
        teamMemberRepository.deleteByUserIdAndTeamId(userId, teamId);
    }

    @Transactional
    public void deleteTeam(UUID id) {
        teamRepository.deleteById(id);
    }
}
