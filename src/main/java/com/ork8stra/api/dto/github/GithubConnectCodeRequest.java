package com.ork8stra.api.dto.github;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GithubConnectCodeRequest {
    @NotBlank(message = "OAuth code is required")
    private String code;
}
