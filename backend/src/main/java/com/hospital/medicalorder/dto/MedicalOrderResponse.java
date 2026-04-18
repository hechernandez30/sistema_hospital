package com.hospital.medicalorder.dto;

import java.time.LocalDateTime;

public record MedicalOrderResponse(
        Long id,
        Long medicalCareId,
        String orderType,
        String description,
        String priority,
        String status,
        String observations,
        LocalDateTime orderDate
) {
}
