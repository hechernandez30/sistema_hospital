package com.hospital.admission.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record AdmissionCreateRequest(
        @NotNull Long patientId,
        Long appointmentId,
        @NotBlank
        @Pattern(regexp = "CONSULTA|EMERGENCIA|HOSPITALIZACION", message = "Invalid admissionType")
        String admissionType,
        @Pattern(regexp = "PENDIENTE|ADMITIDO|ALTA|TRANSFERIDO|RECHAZADO", message = "Invalid status")
        String status,
        @Size(max = 100) String currentArea,
        @Size(max = 30) String room,
        Boolean financialValidationOk,
        @Pattern(regexp = "SEGURO|PAGO_SITIO", message = "validationSource must be SEGURO or PAGO_SITIO")
        String validationSource,
        String observations,
        LocalDateTime dischargeDate,
        @Size(max = 100) String transferredArea,
        Long admittedByUserId
) {}
