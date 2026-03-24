package com.ork8stra.auth.security;

import com.ork8stra.applicationmanagement.Application;
import com.ork8stra.applicationmanagement.ApplicationRepository;
import com.ork8stra.auth.security.policy.PolicyEvaluator;
import com.ork8stra.organizationmanagement.*;
import com.ork8stra.projectmanagement.Project;
import com.ork8stra.projectmanagement.ProjectRepository;
import com.ork8stra.teammanagement.Team;
import com.ork8stra.teammanagement.TeamMemberRepository;
import com.ork8stra.teammanagement.TeamRepository;
import com.ork8stra.user.User;
import com.ork8stra.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@lombok.extern.slf4j.Slf4j
@Service
@RequiredArgsConstructor
public class RbacService {

    private final OrgMemberRepository orgMemberRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;
    private final OrgPolicyRepository orgPolicyRepository;
    private final OrganizationRepository organizationRepository;
    private final ProjectRepository projectRepository;
    private final TeamRepository teamRepository;
    private final ApplicationRepository applicationRepository;
    private final PolicyEvaluator policyEvaluator;

    public boolean hasOrgRole(UUID orgId, String minRole) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            log.warn("RBAC: No current user found in security context");
            return false;
        }

        // Developer/Owner Bypass: If user is the organization owner, grant all access
        Optional<Organization> org = organizationRepository.findById(orgId);
        if (org.isPresent() && currentUser.getId().equals(org.get().getOwnerId())) {
            log.info("RBAC: Granting OWNER/DEVELOPER bypass for user {} in org {}", currentUser.getUsername(), orgId);
            return true;
        }

        Optional<OrgMember> membership = orgMemberRepository.findByUserIdAndOrganizationId(currentUser.getId(), orgId);
        if (membership.isEmpty()) {
            log.info("RBAC: User {} is not a member of org {}", currentUser.getUsername(), orgId);
            return false;
        }

        OrgRole userRole = membership.get().getRole();
        if (userRole == null) {
            log.error("RBAC: User {} has null role in org {}", currentUser.getUsername(), orgId);
            return false;
        }
        
        OrgRole requiredRole = OrgRole.valueOf(minRole.toUpperCase().startsWith("ORG_") ? minRole : "ORG_" + minRole.toUpperCase());
        boolean hasAccess = userRole.ordinal() <= requiredRole.ordinal();
        
        if (!hasAccess) {
            log.info("RBAC: User {} role {} is insufficient for required role {}", 
                currentUser.getUsername(), userRole, requiredRole);
        }

        return hasAccess;
    }

    public boolean hasTeamAccess(UUID teamId) {
        User currentUser = getCurrentUser();
        if (currentUser == null) return false;

        return teamMemberRepository.findByUserIdAndTeamId(currentUser.getId(), teamId).isPresent();
    }

    public boolean hasPermission(UUID orgId, String permission) {
        return hasPermission(orgId, null, permission, "*");
    }

    public boolean hasPermission(UUID orgId, UUID teamId, String permission) {
        String resource = (teamId != null) ? "arn:kubelite:team:" + teamId : "*";
        return hasPermission(orgId, teamId, permission, resource);
    }

    public boolean hasPermission(UUID orgId, UUID teamId, String action, String resource) {
        User currentUser = getCurrentUser();
        if (currentUser == null) return false;

        // Developer/Owner Bypass: If user is the organization owner, grant all permissions
        Optional<Organization> org = organizationRepository.findById(orgId);
        if (org.isPresent() && currentUser.getId().equals(org.get().getOwnerId())) {
            return true;
        }

        java.util.List<String> rawPolicies = new java.util.ArrayList<>();

        // 1. Collect Organization-level policies
        Optional<OrgMember> orgMembership = orgMemberRepository.findByUserIdAndOrganizationId(currentUser.getId(), orgId);
        if (orgMembership.isPresent()) {
            OrgMember member = orgMembership.get();
            if (member.getRole() == OrgRole.ORG_OWNER || member.getRole() == OrgRole.ORG_ADMIN) {
                return true;
            }
            if (member.getPolicyIds() != null) {
                orgPolicyRepository.findAllById(member.getPolicyIds())
                    .forEach(p -> rawPolicies.add(p.getDocument()));
            }
        }

        // 2. Collect Team-level policies
        if (teamId != null) {
            Optional<com.ork8stra.teammanagement.TeamMember> teamMembership = 
                teamMemberRepository.findByUserIdAndTeamId(currentUser.getId(), teamId);
            if (teamMembership.isPresent() && teamMembership.get().getPolicyIds() != null) {
                orgPolicyRepository.findAllById(teamMembership.get().getPolicyIds())
                    .forEach(p -> rawPolicies.add(p.getDocument()));
            }
        }

        return policyEvaluator.isAllowed(rawPolicies, action, resource);
    }

    public boolean hasProjectPermission(UUID projectId, String action) {
        Optional<Project> project = projectRepository.findById(projectId);
        if (project.isEmpty()) {
            return false;
        }

        UUID teamId = project.get().getTeamId();
        if (teamId == null) return false;

        Optional<Team> team = teamRepository.findById(teamId);
        if (team.isEmpty()) return false;

        return hasPermission(team.get().getOrganizationId(), teamId, action, "arn:kubelite:project:" + projectId);
    }

    public boolean hasApplicationPermission(UUID applicationId, String action) {
        Optional<Application> app = applicationRepository.findById(applicationId);
        if (app.isEmpty()) return false;
        return hasProjectPermission(app.get().getProjectId(), action);
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsernameIgnoreCase(email).orElse(null);
    }
}
