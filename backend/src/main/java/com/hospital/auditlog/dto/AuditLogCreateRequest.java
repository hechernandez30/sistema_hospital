package com.hospital.auditlog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Map;

public record AuditLogCreateRequest(
        Long userId,
        @NotBlank @Size(max = 100) String module,
        @NotBlank @Size(max = 100) String entityType,
        @NotBlank @Size(max = 100) String recordId,
        @NotBlank @Size(max = 100) String action,
        Map<String, Object> previousData,
        Map<String, Object> newData,
        String clientIp
) {}
