package com.hospital.triage.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TriageResponse(
        Long id,
        Long admissionId,
        Short heartRate,
        Short respiratoryRate,
        Short systolicPressure,
        Short diastolicPressure,
        BigDecimal oxygenSaturation,
        BigDecimal temperature,
        Short pain,
        String symptoms,
        String priority,
        Integer targetMinutes,
        Long responsibleStaffId,
        LocalDateTime registeredAt
) {}
