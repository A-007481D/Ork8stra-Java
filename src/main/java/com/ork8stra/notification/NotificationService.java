package com.ork8stra.notification;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional
    public void sendNotification(UUID userId, NotificationType type, String title, String message) {
        sendNotification(userId, type, title, message, null);
    }

    @Transactional
    public void sendNotification(UUID userId, NotificationType type, String title, String message, UUID orgId) {
        log.info("Sending notification to user {}: [{}] {}", userId, type, title);
        
        Notification notification = Notification.builder()
                .userId(userId)
                .orgId(orgId)
                .type(type)
                .title(title)
                .message(message)
                .read(false)
                .createdAt(Instant.now())
                .build();
        
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(UUID userId) {
        var unread = notificationRepository.findByUserIdAndReadFalse(userId);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }
}
