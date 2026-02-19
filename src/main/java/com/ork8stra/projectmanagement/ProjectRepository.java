package com.ork8stra.projectmanagement;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, UUID> {
    List<Project> findByTeamId(UUID teamId);
}
