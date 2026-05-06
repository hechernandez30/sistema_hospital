package com.hospital.insurance.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record InsuranceRequest(
        @NotBlank(message = "El nombre de la aseguradora es obligatorio")
        @Size(max = 150, message = "El nombre de la aseguradora no debe superar 150 caracteres")
        String insurerName,
        @NotBlank(message = "El número de póliza es obligatorio")
        @Size(max = 50, message = "El número de póliza no debe superar 50 caracteres")
        String policyNumber,
        @NotNull(message = "El porcentaje de cobertura es obligatorio")
        @DecimalMin(value = "0.0", message = "El porcentaje de cobertura debe ser al menos 0,0")
        @DecimalMax(value = "100.0", message = "El porcentaje de cobertura no debe superar 100,0")
        BigDecimal coveragePercent,
        LocalDate startDate,
        LocalDate endDate,
        Boolean active
) {}
