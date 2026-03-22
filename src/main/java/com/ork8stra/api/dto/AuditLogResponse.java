package com.ork8stra.api.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class AuditLogResponse {
    private String id;
    private String userId;
    private String username;
    private String action;
    private String targetName;
    private String details;
    private LocalDateTime createdAt;
}
