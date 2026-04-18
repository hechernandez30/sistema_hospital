package com.hospital.laboratory.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record LaboratoryCreateRequest(
        @NotNull Long medicalOrderId,
        @Pattern(regexp = "^$|INTERNO|EXTERNO", message = "requesterType must be INTERNO or EXTERNO")
        String requesterType,
        @Pattern(regexp = "^$|MUESTRA_MEDICA|LABORATORIO", message = "requestType must be MUESTRA_MEDICA or LABORATORIO")
        String requestType,
        @Size(max = 40) String recordNumber,
        String sampleDescription,
        Boolean sampleReceived,
        Boolean sampleValid,
        String incident,
        String result,
        String attachment,
        @Pattern(regexp = "PENDIENTE|EN_PROCESO|COMPLETADO|RECHAZADO", message = "Invalid status")
        String status,
        Long responsibleStaffId
) {}
