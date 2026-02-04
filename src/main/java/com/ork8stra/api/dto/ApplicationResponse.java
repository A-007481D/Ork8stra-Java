package com.ork8stra.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationResponse {
    private UUID id;
    private String name;
    private UUID projectId;
    private String gitRepoUrl;
    private String buildBranch;
    private Map<String, String> envVars;
}
