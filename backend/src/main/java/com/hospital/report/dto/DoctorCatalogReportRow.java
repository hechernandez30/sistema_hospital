package com.hospital.report.dto;

import java.time.LocalDate;

public record DoctorCatalogReportRow(
        Long doctorId,
        String doctorName,
        String employeeCode,
        String licenseNumber,
        String specialtyName,
        String schedule,
        String attendance,
        boolean active,
        LocalDate hireDate) {}
