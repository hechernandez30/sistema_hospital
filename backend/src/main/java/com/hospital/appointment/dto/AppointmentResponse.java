package com.hospital.appointment.dto;

import java.time.LocalDateTime;

public record AppointmentResponse(
        Long id,
        Long patientId,
        Long doctorId,
        Long specialtyId,
        LocalDateTime startAt,
        LocalDateTime endAt,
        String reason,
        String status,
        boolean notifyEmail,
        boolean notifySms,
        boolean notifyWhatsapp,
        Long createdByUserId,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
