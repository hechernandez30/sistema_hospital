package com.hospital.report.dto;

public record DoctorProductivityReportRow(
        Long doctorId,
        String doctorName,
        String specialtyName,
        long appointmentCount,
        long attendedAppointmentCount,
        long noShowAppointmentCount,
        long medicalCareCount,
        long pendingCareCount,
        long medicalOrderCount,
        long admissionCount,
        long labCompletedCount,
        long labPendingCount,
        long imagingCompletedCount) {}
