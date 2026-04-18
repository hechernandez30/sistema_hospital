package com.hospital.insurance.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record InsuranceResponse(
        Long id,
        Long patientId,
        String insurerName,
        String policyNumber,
        BigDecimal coveragePercent,
        LocalDate startDate,
        LocalDate endDate,
        boolean active
) {}
