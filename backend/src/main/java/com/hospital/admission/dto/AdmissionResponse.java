package com.hospital.admission.dto;

import java.time.LocalDateTime;

public record AdmissionResponse(
        Long id,
        Long patientId,
        Long appointmentId,
        String admissionType,
        String status,
        String currentArea,
        String room,
        boolean financialValidationOk,
        String validationSource,
        String observations,
        LocalDateTime admissionDate,
        LocalDateTime dischargeDate,
        String transferredArea,
        Long admittedByUserId
) {}
