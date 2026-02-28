package com.ork8stra.api.dto;

import lombok.Data;

import java.util.Map;

@Data
public class UpdateApplicationRequest {
    private String gitRepoUrl;
    private String buildBranch;
    private String dockerfilePath;
    private Map<String, String> envVars;
}
