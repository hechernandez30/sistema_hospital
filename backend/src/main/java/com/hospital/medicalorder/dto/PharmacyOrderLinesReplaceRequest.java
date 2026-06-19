package com.hospital.medicalorder.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record PharmacyOrderLinesReplaceRequest(@NotNull(message = "La lista de líneas es obligatoria") @Valid List<PharmacyOrderLineItemRequest> lines) {}
