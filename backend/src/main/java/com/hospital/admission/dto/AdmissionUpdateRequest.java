package com.hospital.admission.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record AdmissionUpdateRequest(
        @NotNull(message = "El paciente es obligatorio")
        Long patientId,
        Long appointmentId,
        @NotBlank(message = "El tipo de admisión es obligatorio")
        @Pattern(
                regexp = "CONSULTA|EMERGENCIA|HOSPITALIZACION",
                message = "El tipo de admisión debe ser CONSULTA, EMERGENCIA u HOSPITALIZACION")
        String admissionType,
        @NotBlank(message = "El estado es obligatorio")
        @Pattern(
                regexp = "PENDIENTE|ADMITIDO|ALTA|TRANSFERIDO|RECHAZADO|ANULADO",
                message = "El estado debe ser PENDIENTE, ADMITIDO, ALTA, TRANSFERIDO, RECHAZADO o ANULADO")
        String status,
        @Size(max = 100, message = "El área actual no debe superar 100 caracteres")
        String currentArea,
        @Size(max = 30, message = "La habitación no debe superar 30 caracteres")
        String room,
        boolean financialValidationOk,
        @Pattern(
                regexp = "^$|SEGURO|PAGO_SITIO",
                message = "La fuente de validación debe ser SEGURO o PAGO_SITIO")
        String validationSource,
        String observations,
        LocalDateTime dischargeDate,
        @Size(max = 100, message = "El área de traslado no debe superar 100 caracteres")
        String transferredArea,
        Long admittedByUserId
) {}
