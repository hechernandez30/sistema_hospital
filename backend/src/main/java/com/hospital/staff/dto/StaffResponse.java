package com.hospital.staff.dto;

import java.time.LocalDate;

public record StaffResponse(
        Long id,
        Long userId,
        Long specialtyId,
        String staffType,
        String employeeCode,
        String licenseNumber,
        String schedule,
        String attendance,
        boolean active,
        LocalDate hireDate
) {}
