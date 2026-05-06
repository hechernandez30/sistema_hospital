package com.hospital.staff.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record StaffCreateRequest(
        Long userId,
        Long specialtyId,
        @NotBlank(message = "El tipo de personal es obligatorio")
        @Pattern(
                regexp = "MEDICO|ENFERMERIA|ADMINISTRATIVO|LABORATORIO|FARMACIA|CONTABILIDAD|RRHH",
                message =
                        "El tipo de personal debe ser MEDICO, ENFERMERIA, ADMINISTRATIVO, LABORATORIO, FARMACIA, CONTABILIDAD o RRHH")
        String staffType,
        @NotBlank(message = "El código de empleado es obligatorio")
        @Size(max = 30, message = "El código de empleado no debe superar 30 caracteres")
        String employeeCode,
        @Size(max = 50, message = "El número de colegiado no debe superar 50 caracteres")
        String licenseNumber,
        @Size(max = 100, message = "El horario no debe superar 100 caracteres")
        String schedule,
        @Pattern(
                regexp = "PRESENTE|AUSENTE|PERMISO|VACACIONES",
                message = "La asistencia debe ser PRESENTE, AUSENTE, PERMISO o VACACIONES")
        String attendance,
        Boolean active,
        LocalDate hireDate
) {}
