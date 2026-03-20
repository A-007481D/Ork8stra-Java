package com.ork8stra.applicationmanagement;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ServiceConnectionRepository extends JpaRepository<ServiceConnection, UUID> {
    List<ServiceConnection> findBySourceAppId(UUID sourceAppId);
    List<ServiceConnection> findByTargetAppId(UUID targetAppId);
    void deleteBySourceAppIdAndTargetAppId(UUID sourceAppId, UUID targetAppId);
}
