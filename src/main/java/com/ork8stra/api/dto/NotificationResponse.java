package com.ork8stra.api.dto;

import com.ork8stra.notification.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private String id;
    private String userId;
    private String orgId;
    private NotificationType type;
    private String title;
    private String message;
    private boolean read;
    private Instant createdAt;
}
