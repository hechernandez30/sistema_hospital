package com.hospital.report.dto;

import java.time.LocalDateTime;

public record AppointmentReportRow(
        Long appointmentId,
        Long patientId,
        Long doctorId,
        LocalDateTime startAt,
        LocalDateTime endAt,
        String status
) {}
