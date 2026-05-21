package com.hospital.role.repository;

import com.hospital.role.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RoleRepository extends JpaRepository<Role, Long> {

    List<Role> findByActiveTrue();

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Role r SET r.active = false WHERE r.id = :id AND r.active = true")
    int deactivateById(@Param("id") Long id);
}
