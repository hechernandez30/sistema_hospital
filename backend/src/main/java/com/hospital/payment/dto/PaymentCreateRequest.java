package com.hospital.payment.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record PaymentCreateRequest(
        @NotNull(message = "El paciente es obligatorio")
        Long patientId,
        Long admissionId,
        Long medicalOrderId,
        @NotBlank(message = "El concepto es obligatorio")
        @Size(max = 200, message = "El concepto no debe superar 200 caracteres")
        String concept,
        @NotNull(message = "El subtotal es obligatorio")
        @DecimalMin(value = "0.0", message = "El subtotal debe ser al menos 0,0")
        BigDecimal subtotal,
        @NotNull(message = "El porcentaje de seguro es obligatorio")
        @DecimalMin(value = "0.0", message = "El porcentaje de seguro debe ser al menos 0,0")
        @DecimalMax(value = "100.0", message = "El porcentaje de seguro no debe superar 100,0")
        BigDecimal insurancePercent,
        @NotNull(message = "El copago es obligatorio")
        @DecimalMin(value = "0.0", message = "El copago debe ser al menos 0,0")
        BigDecimal copay,
        @Pattern(
                regexp = "^$|EFECTIVO|TARJETA|TRANSFERENCIA",
                message = "El método de pago debe ser EFECTIVO, TARJETA o TRANSFERENCIA")
        String paymentMethod,
        @NotBlank(message = "El estado del pago es obligatorio")
        @Pattern(
                regexp = "PENDIENTE|PAGADO|ANULADO",
                message = "El estado debe ser PENDIENTE, PAGADO o ANULADO")
        String status,
        @Size(max = 50, message = "El número de recibo no debe superar 50 caracteres")
        String receiptNumber,
        Long registeredByUserId
) {}
