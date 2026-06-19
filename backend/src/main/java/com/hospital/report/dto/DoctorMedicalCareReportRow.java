package com.hospital.report.dto;

import java.time.LocalDateTime;

public record DoctorMedicalCareReportRow(
        Long medicalCareId,
        Long patientId,
        String patientName,
        Long doctorId,
        String doctorName,
        String specialtyName,
        String diagnosis,
        boolean requiresHospitalization,
        LocalDateTime careDate) {}
