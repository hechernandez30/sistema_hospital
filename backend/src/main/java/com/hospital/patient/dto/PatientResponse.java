package com.hospital.patient.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record PatientResponse(
        Long id,
        String patientCode,
        String firstName,
        String lastName,
        String dpiNit,
        LocalDate birthDate,
        String sex,
        String phone,
        String email,
        String address,
        String emergencyContactName,
        String emergencyContactPhone,
        boolean privacyAccepted,
        String allergies,
        String conditions,
        String medicalHistory,
        String currentMedications,
        boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
