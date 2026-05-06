package com.hospital.specialty.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SpecialtyRequest(
        @NotBlank(message = "El nombre de la especialidad es obligatorio")
        @Size(max = 100, message = "El nombre no debe superar 100 caracteres")
        String name,
        @NotNull(message = "La duración en minutos es obligatoria")
        @Min(value = 20, message = "La duración debe ser al menos 20 minutos")
        @Max(value = 60, message = "La duración no debe superar 60 minutos")
        Integer durationMinutes
) {}
