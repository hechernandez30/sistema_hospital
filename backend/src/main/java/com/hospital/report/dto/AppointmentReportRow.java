package com.hospital.report.dto;

import java.time.LocalDateTime;

public record AppointmentReportRow(
        Long appointmentId,
        Long patientId,
        String patientName,
        Long doctorId,
        String doctorName,
        LocalDateTime startAt,
        LocalDateTime endAt,
        String status
) {}
