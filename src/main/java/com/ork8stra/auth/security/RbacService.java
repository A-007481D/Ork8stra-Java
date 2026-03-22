package com.ork8stra.auth.security;

import com.ork8stra.organizationmanagement.OrgMember;
import com.ork8stra.organizationmanagement.OrgMemberRepository;
import com.ork8stra.organizationmanagement.OrgPolicyRepository;
import com.ork8stra.organizationmanagement.OrgRole;
import com.ork8stra.teammanagement.TeamMemberRepository;
import com.ork8stra.user.User;
import com.ork8stra.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
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

    public boolean hasOrgRole(UUID orgId, String minRole) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            log.warn("RBAC: No current user found in security context");
            return false;
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
        User currentUser = getCurrentUser();
        if (currentUser == null) return false;

        Optional<OrgMember> membership = orgMemberRepository.findByUserIdAndOrganizationId(currentUser.getId(), orgId);
        if (membership.isEmpty()) return false;

        OrgMember member = membership.get();
        
        // 1. Check Role-based permissions (Broad defaults)
        if (member.getRole() == OrgRole.ORG_OWNER || member.getRole() == OrgRole.ORG_ADMIN) {
            return true; // Overlords
        }

        // 2. Check Policy-based permissions (Granular)
        List<UUID> policyIds = member.getPolicyIds();
        if (policyIds == null || policyIds.isEmpty()) return false;

        return orgPolicyRepository.findAllById(policyIds).stream()
                .flatMap(p -> p.getPermissions().stream())
                .anyMatch(p -> p.equalsIgnoreCase(permission) || p.equals("*"));
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsernameIgnoreCase(email).orElse(null);
    }
}
