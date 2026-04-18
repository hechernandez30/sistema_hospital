package com.hospital.staff.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record StaffCreateRequest(
        Long userId,
        Long specialtyId,
        @NotBlank
        @Pattern(regexp = "MEDICO|ENFERMERIA|ADMINISTRATIVO|LABORATORIO|FARMACIA|CONTABILIDAD|RRHH",
                message = "Invalid staffType")
        String staffType,
        @NotBlank @Size(max = 30) String employeeCode,
        @Size(max = 50) String licenseNumber,
        @Size(max = 100) String schedule,
        @Pattern(regexp = "PRESENTE|AUSENTE|PERMISO|VACACIONES", message = "Invalid attendance")
        String attendance,
        Boolean active,
        LocalDate hireDate
) {}
