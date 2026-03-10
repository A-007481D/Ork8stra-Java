package com.ork8stra.api.controller;

import com.ork8stra.api.dto.BuildResponse;
import com.ork8stra.buildengine.Build;
import com.ork8stra.buildengine.RollbackService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/apps/{appId}")
@RequiredArgsConstructor
public class RollbackController {

    private final RollbackService rollbackService;

    @PostMapping("/rollback/{buildId}")
    public ResponseEntity<BuildResponse> rollback(
            @PathVariable UUID appId,
            @PathVariable UUID buildId) {
        Build result = rollbackService.rollbackToVersion(appId, buildId);
        return ResponseEntity.ok(BuildResponse.from(result));
    }
}
