package com.hospital.medicalcare.dto;

import java.time.LocalDateTime;

public record MedicalCareResponse(
        Long id,
        Long patientId,
        Long admissionId,
        Long appointmentId,
        Long doctorId,
        String consultationReason,
        String clinicalEvaluation,
        String diagnosis,
        String treatmentPlan,
        boolean requiresHospitalization,
        LocalDateTime careDate
) {
}
