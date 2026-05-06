package com.hospital.report.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentReportRow(
        Long paymentId,
        Long patientId,
        String status,
        String paymentMethod,
        BigDecimal totalToPay,
        LocalDateTime paidAt
) {}
