package com.ork8stra.api.controller;

import com.ork8stra.api.dto.NotificationResponse;
import com.ork8stra.notification.Notification;
import com.ork8stra.notification.NotificationRepository;
import com.ork8stra.user.User;
import com.ork8stra.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final com.ork8stra.notification.NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> listNotifications(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        User user = userRepository.findByUsernameIgnoreCase(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        Page<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(
                user.getId(), PageRequest.of(page, size));
        
        List<NotificationResponse> responses = notifications.getContent().stream()
                .map(this::toResponse)
                .toList();
        
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsernameIgnoreCase(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        long count = notificationRepository.countByUserIdAndReadFalse(user.getId());
        return ResponseEntity.ok(count);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable UUID id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        
        notification.setRead(true);
        notificationRepository.save(notification);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsernameIgnoreCase(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        notificationService.markAllAsRead(user.getId());
        return ResponseEntity.noContent().build();
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId().toString())
                .userId(n.getUserId().toString())
                .orgId(n.getOrgId() != null ? n.getOrgId().toString() : null)
                .type(n.getType())
                .title(n.getTitle())
                .message(n.getMessage())
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
