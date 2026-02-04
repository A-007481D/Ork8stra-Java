package com.ork8stra.api.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class OrganizationResponse {
    private UUID id;
    private String name;
    private String slug;
    private UUID ownerId;
    private Instant createdAt;
}
