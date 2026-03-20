package com.ork8stra.api.controller;

import com.ork8stra.api.dto.ServiceConnectionRequest;
import com.ork8stra.api.dto.ServiceConnectionResponse;
import com.ork8stra.applicationmanagement.ServiceConnection;
import com.ork8stra.applicationmanagement.ServiceConnectionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/connections")
@RequiredArgsConstructor
@Slf4j
public class ServiceConnectionController {

    private final ServiceConnectionService connectionService;

    @PostMapping
    public ResponseEntity<ServiceConnectionResponse> createConnection(@RequestBody ServiceConnectionRequest request) {
        log.info("API: Creating connection from {} to {}", request.getSourceAppId(), request.getTargetAppId());
        ServiceConnection connection = connectionService.createConnection(request.getSourceAppId(), request.getTargetAppId());
        connection.setMetadata(request.getMetadata());
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(connection));
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteConnection(@RequestParam UUID sourceAppId, @RequestParam UUID targetAppId) {
        log.info("API: Deleting connection from {} to {}", sourceAppId, targetAppId);
        connectionService.deleteConnection(sourceAppId, targetAppId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/source/{sourceAppId}")
    public ResponseEntity<List<ServiceConnectionResponse>> getOutgoingConnections(@PathVariable UUID sourceAppId) {
        List<ServiceConnectionResponse> connections = connectionService.getOutgoingConnections(sourceAppId).stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(connections);
    }

    @GetMapping("/target/{targetAppId}")
    public ResponseEntity<List<ServiceConnectionResponse>> getIncomingConnections(@PathVariable UUID targetAppId) {
        List<ServiceConnectionResponse> connections = connectionService.getIncomingConnections(targetAppId).stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(connections);
    }

    private ServiceConnectionResponse toResponse(ServiceConnection connection) {
        return ServiceConnectionResponse.builder()
                .id(connection.getId())
                .sourceAppId(connection.getSourceAppId())
                .targetAppId(connection.getTargetAppId())
                .metadata(connection.getMetadata())
                .build();
    }
}
