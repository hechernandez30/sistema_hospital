package com.hospital.payment.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record PaymentCreateRequest(
        @NotNull Long patientId,
        Long admissionId,
        Long medicalOrderId,
        @NotBlank @Size(max = 200) String concept,
        @NotNull @DecimalMin("0.0") BigDecimal subtotal,
        @NotNull @DecimalMin("0.0") @DecimalMax("100.0") BigDecimal insurancePercent,
        @NotNull @DecimalMin("0.0") BigDecimal copay,
        @Pattern(regexp = "^$|EFECTIVO|TARJETA|TRANSFERENCIA", message = "Invalid payment method")
        String paymentMethod,
        @NotBlank
        @Pattern(regexp = "PENDIENTE|PAGADO|ANULADO", message = "Invalid status")
        String status,
        @Size(max = 50) String receiptNumber,
        Long registeredByUserId
) {}
