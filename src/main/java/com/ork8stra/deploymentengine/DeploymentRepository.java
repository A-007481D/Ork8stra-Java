package com.ork8stra.deploymentengine;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DeploymentRepository extends JpaRepository<Deployment, UUID> {
    List<Deployment> findByApplicationId(UUID applicationId);
    List<Deployment> findByApplicationIdOrderByDeployedAtDesc(UUID applicationId);
    Optional<Deployment> findFirstByApplicationIdOrderByDeployedAtDesc(UUID applicationId);
}
