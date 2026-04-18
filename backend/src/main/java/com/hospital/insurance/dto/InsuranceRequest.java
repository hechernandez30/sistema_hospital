package com.hospital.insurance.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record InsuranceRequest(
        @NotBlank @Size(max = 150) String insurerName,
        @NotBlank @Size(max = 50) String policyNumber,
        @NotNull @DecimalMin("0.0") @DecimalMax("100.0") BigDecimal coveragePercent,
        LocalDate startDate,
        LocalDate endDate,
        Boolean active
) {}
