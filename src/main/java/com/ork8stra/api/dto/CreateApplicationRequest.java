package com.ork8stra.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
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
public class CreateApplicationRequest {

    @NotBlank(message = "Application name is required")
    private String name;

    @NotNull(message = "Project ID is required")
    private UUID projectId;

    @NotBlank(message = "Git repository URL is required")
    @Pattern(regexp = "^(https?|git)://.*", message = "Must be a valid Git URL")
    private String gitRepoUrl;

    private String buildBranch = "main";

    private Map<String, String> envVars;
}
