package com.hospital.laboratory.dto;

import java.time.LocalDateTime;

public record LaboratoryResponse(
        Long id,
        Long medicalOrderId,
        String requesterType,
        String requestType,
        String recordNumber,
        String sampleDescription,
        boolean sampleReceived,
        Boolean sampleValid,
        String incident,
        String result,
        String attachment,
        String status,
        LocalDateTime receptionAt,
        LocalDateTime resultAt,
        Long responsibleStaffId
) {}
