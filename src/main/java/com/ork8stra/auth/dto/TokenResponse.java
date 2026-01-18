package com.ork8stra.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TokenResponse {

    private String accessToken;
    private String tokenType;
    private Long expiresIn;
    private String username;

    public static TokenResponse of(String accessToken, Long expiresIn, String username) {
        return TokenResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .expiresIn(expiresIn)
                .username(username)
                .build();
    }
}
