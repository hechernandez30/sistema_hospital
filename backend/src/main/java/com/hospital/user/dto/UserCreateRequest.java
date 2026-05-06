package com.hospital.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UserCreateRequest(
        @NotNull(message = "El rol es obligatorio")
        Long roleId,
        @NotBlank(message = "El nombre de usuario es obligatorio")
        @Size(max = 100, message = "El nombre de usuario no debe superar 100 caracteres")
        String username,
        @NotBlank(message = "El correo electrónico es obligatorio")
        @Email(message = "Debe ingresar un correo electrónico válido")
        @Size(max = 150, message = "El correo no debe superar 150 caracteres")
        String email,
        @NotBlank(message = "La contraseña es obligatoria")
        @Size(min = 8, max = 255, message = "La contraseña debe tener entre 8 y 255 caracteres")
        @Pattern(
                regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,255}$",
                message =
                        "La contraseña debe incluir al menos una minúscula, una mayúscula y un número (8 a 255 caracteres)")
        String password,
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 100, message = "El nombre no debe superar 100 caracteres")
        String firstName,
        @NotBlank(message = "El apellido es obligatorio")
        @Size(max = 100, message = "El apellido no debe superar 100 caracteres")
        String lastName,
        Boolean mfaEnabled
) {}
