package com.hospital.laboratory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record LaboratoryUpdateRequest(
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
        boolean sampleReceived,
        Boolean sampleValid,
        String incident,
        String result,
        String attachment,
        @NotBlank(message = "El estado es obligatorio")
        @Pattern(
                regexp = "PENDIENTE|EN_PROCESO|COMPLETADO|RECHAZADO|ANULADO",
                message = "El estado debe ser PENDIENTE, EN_PROCESO, COMPLETADO, RECHAZADO o ANULADO")
        String status,
        LocalDateTime receptionAt,
        LocalDateTime resultAt,
        Long responsibleStaffId
) {}
