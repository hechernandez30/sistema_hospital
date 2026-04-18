package com.hospital.patient.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record PatientCreateRequest(
        @NotBlank @Size(max = 30) String patientCode,
        @NotBlank @Size(max = 100) String firstName,
        @NotBlank @Size(max = 100) String lastName,
        @NotBlank @Size(max = 30) String dpiNit,
        @NotNull @Past LocalDate birthDate,
        @Pattern(regexp = "M|F|OTRO", message = "sex must be M, F or OTRO") String sex,
        @Pattern(regexp = "^\\+?[0-9]{8,15}$", message = "Invalid phone format") String phone,
        @Email @Size(max = 150) String email,
        String address,
        @Size(max = 150) String emergencyContactName,
        @Pattern(regexp = "^$|^\\+?[0-9]{8,15}$", message = "Invalid emergency phone format") String emergencyContactPhone,
        @NotNull @AssertTrue(message = "Privacy acceptance is required") Boolean privacyAccepted,
        String allergies,
        String conditions,
        String medicalHistory,
        String currentMedications,
        Boolean active
) {}
