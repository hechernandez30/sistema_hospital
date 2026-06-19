package com.hospital.report.dto;

import java.time.LocalDateTime;

public record DoctorAdmissionReportRow(
        Long admissionId,
        Long patientId,
        String patientName,
        Long doctorId,
        String doctorName,
        String specialtyName,
        Long appointmentId,
        String admissionType,
        String status,
        LocalDateTime admissionDate,
        LocalDateTime dischargeDate) {}
