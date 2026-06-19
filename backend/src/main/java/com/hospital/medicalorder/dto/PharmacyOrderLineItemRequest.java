package com.hospital.medicalorder.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record PharmacyOrderLineItemRequest(
        @NotNull(message = "El medicamento es obligatorio") Long medicationId,
        @NotNull(message = "La cantidad es obligatoria") @Min(value = 1, message = "La cantidad debe ser al menos 1") Integer quantity) {}
