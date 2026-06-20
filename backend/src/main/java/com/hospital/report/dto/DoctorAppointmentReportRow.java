package com.hospital.report.dto;

import java.time.LocalDateTime;

public record DoctorAppointmentReportRow(
        Long appointmentId,
        Long patientId,
        String patientName,
        Long doctorId,
        String doctorName,
        String specialtyName,
        String reason,
        boolean notifyEmail,
        LocalDateTime startAt,
        LocalDateTime endAt,
        String status) {}
