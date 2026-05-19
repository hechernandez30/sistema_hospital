package com.hospital.patient.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record PatientUpdateRequest(
        @NotBlank(message = "El código de paciente es obligatorio")
        @Size(max = 30, message = "El código de paciente no debe superar 30 caracteres")
        String patientCode,
        @NotBlank(message = "El nombre es obligatorio")
        @Size(min = 2, max = 100, message = "El nombre debe tener entre 2 y 100 caracteres")
        @Pattern(
                regexp = "^(?=.*\\p{L})[\\p{L} ]{2,100}$",
                message =
                        "El nombre debe contener solo letras (incluye acentos) y espacios, entre 2 y 100 caracteres, con al menos una letra")
        String firstName,
        @NotBlank(message = "El apellido es obligatorio")
        @Size(min = 2, max = 100, message = "El apellido debe tener entre 2 y 100 caracteres")
        @Pattern(
                regexp = "^(?=.*\\p{L})[\\p{L} ]{2,100}$",
                message =
                        "El apellido debe contener solo letras (incluye acentos) y espacios, entre 2 y 100 caracteres, con al menos una letra")
        String lastName,
        @NotBlank(message = "El DPI/NIT es obligatorio")
        @Size(max = 30, message = "El DPI/NIT no debe superar 30 caracteres")
        String dpiNit,
        @NotNull(message = "La fecha de nacimiento es obligatoria")
        @Past(message = "La fecha de nacimiento debe estar en el pasado")
        LocalDate birthDate,
        @Pattern(regexp = "M|F|OTRO", message = "El sexo debe ser M, F u OTRO")
        String sex,
        @Pattern(regexp = "^[0-9]{8}$", message = "El teléfono debe tener exactamente 8 dígitos (solo números, sin código de país)")
        String phone,
        @Email(message = "Debe ingresar un correo electrónico válido")
        @Size(max = 150, message = "El correo no debe superar 150 caracteres")
        String email,
        String address,
        @Size(max = 150, message = "El nombre del contacto de emergencia no debe superar 150 caracteres")
        String emergencyContactName,
        @Pattern(
                regexp = "^$|^[0-9]{8}$",
                message = "El teléfono de emergencia debe tener exactamente 8 dígitos o dejarse vacío (solo números, sin código de país)")
        String emergencyContactPhone,
        boolean privacyAccepted,
        String allergies,
        String conditions,
        String medicalHistory,
        String currentMedications,
        boolean active
) {}
