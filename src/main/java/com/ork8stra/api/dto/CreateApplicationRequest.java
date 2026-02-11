package com.ork8stra.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateApplicationRequest {

    @NotBlank(message = "Application name is required")
    private String name;

    @NotBlank(message = "Git repository URL is required")
    @Pattern(regexp = "^(https?|git)://.*", message = "Must be a valid Git URL")
    private String gitRepoUrl;

    @Builder.Default
    private String buildBranch = "main";

    private Map<String, String> envVars;
}
