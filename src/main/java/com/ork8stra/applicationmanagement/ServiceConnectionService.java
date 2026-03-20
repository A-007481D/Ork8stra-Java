package com.ork8stra.applicationmanagement;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ServiceConnectionService {

    private final ServiceConnectionRepository connectionRepository;

    @Transactional
    public ServiceConnection createConnection(UUID sourceAppId, UUID targetAppId) {
        log.info("Creating service connection from '{}' to '{}'", sourceAppId, targetAppId);
        ServiceConnection connection = new ServiceConnection(sourceAppId, targetAppId);
        return connectionRepository.save(connection);
    }

    @Transactional
    public void deleteConnection(UUID sourceAppId, UUID targetAppId) {
        log.info("Deleting service connection from '{}' to '{}'", sourceAppId, targetAppId);
        connectionRepository.deleteBySourceAppIdAndTargetAppId(sourceAppId, targetAppId);
    }

    public List<ServiceConnection> getOutgoingConnections(UUID sourceAppId) {
        return connectionRepository.findBySourceAppId(sourceAppId);
    }

    public List<ServiceConnection> getIncomingConnections(UUID targetAppId) {
        return connectionRepository.findByTargetAppId(targetAppId);
    }
}
