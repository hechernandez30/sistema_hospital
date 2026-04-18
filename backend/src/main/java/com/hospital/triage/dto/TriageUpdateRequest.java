package com.hospital.triage.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;

public record TriageUpdateRequest(
        @NotNull Long admissionId,
        @Min(0) @Max(300) Integer heartRate,
        @Min(0) @Max(120) Integer respiratoryRate,
        @Min(0) @Max(300) Integer systolicPressure,
        @Min(0) @Max(200) Integer diastolicPressure,
        @DecimalMin("0.0") @DecimalMax("100.0") BigDecimal oxygenSaturation,
        @DecimalMin("20.0") @DecimalMax("45.0") BigDecimal temperature,
        @Min(0) @Max(10) Integer pain,
        String symptoms,
        @NotBlank
        @Pattern(regexp = "I_CRITICO|II_URGENTE|III_PRIORITARIO|IV_NO_URGENTE", message = "Invalid triage priority")
        String priority,
        @Min(0) Integer targetMinutes,
        Long responsibleStaffId
) {}
