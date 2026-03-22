package com.ork8stra.teammanagement;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TeamMemberRepository extends JpaRepository<TeamMember, UUID> {

    List<TeamMember> findByTeamId(UUID teamId);

    List<TeamMember> findByUserId(UUID userId);

    Optional<TeamMember> findByUserIdAndTeamId(UUID userId, UUID teamId);

    boolean existsByUserIdAndTeamId(UUID userId, UUID teamId);

    void deleteByUserIdAndTeamId(UUID userId, UUID teamId);
}
