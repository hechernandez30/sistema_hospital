package com.hospital.laboratory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record LaboratoryUpdateRequest(
        @Pattern(regexp = "^$|INTERNO|EXTERNO", message = "requesterType must be INTERNO or EXTERNO")
        String requesterType,
        @Pattern(regexp = "^$|MUESTRA_MEDICA|LABORATORIO", message = "requestType must be MUESTRA_MEDICA or LABORATORIO")
        String requestType,
        @Size(max = 40) String recordNumber,
        String sampleDescription,
        boolean sampleReceived,
        Boolean sampleValid,
        String incident,
        String result,
        String attachment,
        @NotBlank
        @Pattern(regexp = "PENDIENTE|EN_PROCESO|COMPLETADO|RECHAZADO", message = "Invalid status")
        String status,
        LocalDateTime receptionAt,
        LocalDateTime resultAt,
        Long responsibleStaffId
) {}
