package com.hospital.role.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RoleRequest(
        @NotBlank(message = "El nombre del rol es obligatorio")
        @Size(max = 50, message = "El nombre del rol no debe superar 50 caracteres")
        String name,
        @Size(max = 200, message = "La descripción no debe superar 200 caracteres")
        String description
) {}
