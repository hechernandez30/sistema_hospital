package com.hospital.report.dto;

import java.time.LocalDateTime;

public record DoctorMedicalOrderReportRow(
        Long medicalOrderId,
        Long medicalCareId,
        Long patientId,
        String patientName,
        Long doctorId,
        String doctorName,
        String specialtyName,
        String orderType,
        String status,
        String priority,
        LocalDateTime orderDate) {}
