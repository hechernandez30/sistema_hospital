package com.hospital.appointment.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record AppointmentCreateRequest(
        @NotNull(message = "El paciente es obligatorio")
        Long patientId,
        @NotNull(message = "El médico es obligatorio")
        Long doctorId,
        Long specialtyId,
        @NotNull(message = "La fecha y hora de inicio son obligatorias")
        @Future(message = "La fecha y hora de inicio deben ser futuras")
        LocalDateTime startAt,
        @NotNull(message = "La fecha y hora de fin son obligatorias")
        @Future(message = "La fecha y hora de fin deben ser futuras")
        LocalDateTime endAt,
        @Size(max = 250, message = "El motivo no debe superar 250 caracteres")
        String reason,
        @NotBlank(message = "El estado de la cita es obligatorio")
        String status,
        Boolean notifyEmail,
        Boolean notifySms,
        Boolean notifyWhatsapp,
        Long createdByUserId
) {}
