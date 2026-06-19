package com.hospital.report.dto;

import java.time.LocalDateTime;

public record DoctorAppointmentReportRow(
        Long appointmentId,
        Long patientId,
        String patientName,
        Long doctorId,
        String doctorName,
        String specialtyName,
        LocalDateTime startAt,
        LocalDateTime endAt,
        String status) {}
