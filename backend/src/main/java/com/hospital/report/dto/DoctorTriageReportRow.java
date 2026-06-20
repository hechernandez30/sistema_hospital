package com.hospital.report.dto;

import java.time.LocalDateTime;

public record DoctorTriageReportRow(
        Long triageId,
        Long admissionId,
        Long patientId,
        String patientName,
        Long doctorId,
        String doctorName,
        String specialtyName,
        String admissionType,
        String priority,
        Integer targetMinutes,
        LocalDateTime registeredAt) {}
