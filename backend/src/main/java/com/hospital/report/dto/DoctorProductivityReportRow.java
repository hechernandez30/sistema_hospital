package com.hospital.report.dto;

public record DoctorProductivityReportRow(
        Long doctorId,
        String doctorName,
        String specialtyName,
        long appointmentCount,
        long attendedAppointmentCount,
        long medicalCareCount,
        long medicalOrderCount,
        long admissionCount) {}
