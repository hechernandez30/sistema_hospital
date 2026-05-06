package com.hospital.report.dto;

import java.time.LocalDateTime;

public record AdmissionReportRow(
        Long admissionId,
        Long patientId,
        String admissionType,
        String status,
        LocalDateTime admissionDate,
        LocalDateTime dischargeDate
) {}
