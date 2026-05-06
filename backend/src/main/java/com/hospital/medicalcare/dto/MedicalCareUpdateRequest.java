package com.hospital.medicalcare.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record MedicalCareUpdateRequest(
        @NotNull(message = "El paciente es obligatorio")
        Long patientId,
        Long admissionId,
        Long appointmentId,
        @NotNull(message = "El médico es obligatorio")
        Long doctorId,
        @NotBlank(message = "El motivo de consulta es obligatorio")
        String consultationReason,
        @NotBlank(message = "La evaluación clínica es obligatoria")
        String clinicalEvaluation,
        @NotBlank(message = "El diagnóstico es obligatorio")
        String diagnosis,
        String treatmentPlan,
        boolean requiresHospitalization
) {}
