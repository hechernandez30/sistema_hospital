package com.hospital.medicalcare.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record MedicalCareCreateRequest(
        @NotNull Long patientId,
        Long admissionId,
        Long appointmentId,
        @NotNull Long doctorId,
        @NotBlank String consultationReason,
        @NotBlank String clinicalEvaluation,
        @NotBlank String diagnosis,
        String treatmentPlan,
        Boolean requiresHospitalization
) {
}
