package com.ork8stra.api.controller;

import com.ork8stra.organizationmanagement.Organization;
import com.ork8stra.organizationmanagement.OrganizationService;
import com.ork8stra.user.User;
import com.ork8stra.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/invitations")
@RequiredArgsConstructor
public class OrgInvitationAcceptController {

    private final OrganizationService organizationService;
    private final UserRepository userRepository;

    @PostMapping("/accept")
    public ResponseEntity<Organization> acceptInvitation(
            @RequestParam String token,
            Authentication auth) {
        
        if (auth == null) {
            return ResponseEntity.status(401).build();
        }

        User user = userRepository.findByUsernameIgnoreCase(auth.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Organization org = organizationService.acceptInvitation(token, user.getId());
        return ResponseEntity.ok(org);
    }
}
