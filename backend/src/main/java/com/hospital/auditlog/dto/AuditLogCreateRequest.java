package com.hospital.auditlog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Map;

public record AuditLogCreateRequest(
        Long userId,
        @NotBlank(message = "El módulo es obligatorio")
        @Size(max = 100, message = "El módulo no debe superar 100 caracteres")
        String module,
        @NotBlank(message = "El tipo de entidad es obligatorio")
        @Size(max = 100, message = "El tipo de entidad no debe superar 100 caracteres")
        String entityType,
        @NotBlank(message = "El identificador del registro es obligatorio")
        @Size(max = 100, message = "El identificador del registro no debe superar 100 caracteres")
        String recordId,
        @NotBlank(message = "La acción es obligatoria")
        @Size(max = 100, message = "La acción no debe superar 100 caracteres")
        String action,
        Map<String, Object> previousData,
        Map<String, Object> newData,
        String clientIp
) {}
