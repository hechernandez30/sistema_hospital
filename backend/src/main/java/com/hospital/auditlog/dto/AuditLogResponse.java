package com.hospital.auditlog.dto;

import java.time.LocalDateTime;
import java.util.Map;

public record AuditLogResponse(
        Long id,
        Long userId,
        String module,
        String entityType,
        String recordId,
        String action,
        Map<String, Object> previousData,
        Map<String, Object> newData,
        LocalDateTime occurredAt,
        String clientIp
) {}
