package com.hospital.triage.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;

public record TriageCreateRequest(
        @NotNull(message = "La admisión es obligatoria")
        Long admissionId,
        @Min(value = 0, message = "La frecuencia cardiaca debe ser al menos 0")
        @Max(value = 300, message = "La frecuencia cardiaca no debe superar 300")
        Integer heartRate,
        @Min(value = 0, message = "La frecuencia respiratoria debe ser al menos 0")
        @Max(value = 120, message = "La frecuencia respiratoria no debe superar 120")
        Integer respiratoryRate,
        @Min(value = 0, message = "La presión sistólica debe ser al menos 0")
        @Max(value = 300, message = "La presión sistólica no debe superar 300")
        Integer systolicPressure,
        @Min(value = 0, message = "La presión diastólica debe ser al menos 0")
        @Max(value = 200, message = "La presión diastólica no debe superar 200")
        Integer diastolicPressure,
        @DecimalMin(
                value = "0.0",
                message = "La saturación de oxígeno debe ser al menos 0,0")
        @DecimalMax(
                value = "100.0",
                message = "La saturación de oxígeno no debe superar 100,0")
        BigDecimal oxygenSaturation,
        @DecimalMin(
                value = "20.0",
                message = "La temperatura debe ser al menos 20,0")
        @DecimalMax(
                value = "45.0",
                message = "La temperatura no debe superar 45,0")
        BigDecimal temperature,
        @Min(value = 0, message = "El dolor debe ser al menos 0")
        @Max(value = 10, message = "El dolor no debe superar 10")
        Integer pain,
        String symptoms,
        @NotBlank(message = "La prioridad de triage es obligatoria")
        @Pattern(
                regexp = "I_CRITICO|II_URGENTE|III_PRIORITARIO|IV_NO_URGENTE",
                message =
                        "La prioridad debe ser I_CRITICO, II_URGENTE, III_PRIORITARIO o IV_NO_URGENTE")
        String priority,
        @Min(value = 0, message = "Los minutos objetivo deben ser al menos 0")
        Integer targetMinutes,
        Long responsibleStaffId
) {}
