package com.hospital.payment.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentResponse(
        Long id,
        Long patientId,
        Long admissionId,
        Long medicalOrderId,
        String concept,
        BigDecimal subtotal,
        BigDecimal insurancePercent,
        BigDecimal insuranceDiscount,
        BigDecimal copay,
        BigDecimal totalToPay,
        String paymentMethod,
        String status,
        String receiptNumber,
        LocalDateTime paidAt,
        Long registeredByUserId
) {}
