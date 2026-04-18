package com.hospital.auditlog.repository;

import com.hospital.auditlog.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByModuleOrderByOccurredAtDesc(String module);

    List<AuditLog> findByUser_IdOrderByOccurredAtDesc(Long userId);
}
