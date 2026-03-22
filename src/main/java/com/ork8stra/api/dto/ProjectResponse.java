package com.ork8stra.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;


/**
 * DTO: Project Response
 */

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectResponse {
    private String id;
    private String name;
    private String owner;
    private String sourceType;
    private String sourceLocation;
    private String status; // default to .
    private String serviceUrl;
    private Instant createdAt;
    private Instant updatedAt;
    private String teamName;

}
