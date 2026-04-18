package com.hospital.appointment.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record AppointmentCreateRequest(
        @NotNull Long patientId,
        @NotNull Long doctorId,
        Long specialtyId,
        @NotNull @Future LocalDateTime startAt,
        @NotNull @Future LocalDateTime endAt,
        @Size(max = 250) String reason,
        @NotBlank String status,
        Boolean notifyEmail,
        Boolean notifySms,
        Boolean notifyWhatsapp,
        Long createdByUserId
) {}
