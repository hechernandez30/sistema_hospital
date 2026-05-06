package com.hospital.laboratory.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record LaboratoryCreateRequest(
        @NotNull(message = "La orden médica es obligatoria")
        Long medicalOrderId,
        @Pattern(
                regexp = "^$|INTERNO|EXTERNO",
                message = "El tipo de solicitante debe ser INTERNO o EXTERNO")
        String requesterType,
        @Pattern(
                regexp = "^$|MUESTRA_MEDICA|LABORATORIO",
                message = "El tipo de solicitud debe ser MUESTRA_MEDICA o LABORATORIO")
        String requestType,
        @Size(max = 40, message = "El número de expediente no debe superar 40 caracteres")
        String recordNumber,
        String sampleDescription,
        Boolean sampleReceived,
        Boolean sampleValid,
        String incident,
        String result,
        String attachment,
        @Pattern(
                regexp = "PENDIENTE|EN_PROCESO|COMPLETADO|RECHAZADO",
                message = "El estado debe ser PENDIENTE, EN_PROCESO, COMPLETADO o RECHAZADO")
        String status,
        Long responsibleStaffId
) {}
