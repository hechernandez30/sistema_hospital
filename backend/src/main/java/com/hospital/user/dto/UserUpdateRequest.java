package com.hospital.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UserUpdateRequest(
        @NotNull Long roleId,
        @NotBlank @Email @Size(max = 150) String email,
        @Size(min = 8, max = 255) String password,
        @NotBlank @Size(max = 100) String firstName,
        @NotBlank @Size(max = 100) String lastName,
        @NotBlank
        @Pattern(regexp = "ACTIVO|BLOQUEADO|DESHABILITADO", message = "state must be ACTIVO, BLOQUEADO or DESHABILITADO")
        String state
) {}
