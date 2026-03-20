package com.ork8stra.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceConnectionRequest {
    private UUID sourceAppId;
    private UUID targetAppId;
    private String metadata;
}
