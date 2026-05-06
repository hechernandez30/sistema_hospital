package com.hospital.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UserUpdateRequest(
        @NotNull(message = "El rol es obligatorio")
        Long roleId,
        @NotBlank(message = "El correo electrónico es obligatorio")
        @Email(message = "Debe ingresar un correo electrónico válido")
        @Size(max = 150, message = "El correo no debe superar 150 caracteres")
        String email,
        @Pattern(
                regexp = "^$|^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,255}$",
                message =
                        "Si indica contraseña, debe tener entre 8 y 255 caracteres e incluir al menos una minúscula, una mayúscula y un número")
        String password,
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 100, message = "El nombre no debe superar 100 caracteres")
        String firstName,
        @NotBlank(message = "El apellido es obligatorio")
        @Size(max = 100, message = "El apellido no debe superar 100 caracteres")
        String lastName,
        @NotBlank(message = "El estado es obligatorio")
        @Pattern(
                regexp = "ACTIVO|BLOQUEADO|DESHABILITADO",
                message = "El estado debe ser ACTIVO, BLOQUEADO o DESHABILITADO")
        String state
) {}
