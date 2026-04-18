package com.hospital.appointment.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record AppointmentUpdateRequest(
        @NotNull Long patientId,
        @NotNull Long doctorId,
        Long specialtyId,
        @NotNull @Future LocalDateTime startAt,
        @NotNull @Future LocalDateTime endAt,
        @Size(max = 250) String reason,
        @NotBlank String status,
        boolean notifyEmail,
        boolean notifySms,
        boolean notifyWhatsapp,
        Long createdByUserId
) {}
