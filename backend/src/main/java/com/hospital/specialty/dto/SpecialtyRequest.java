package com.hospital.specialty.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SpecialtyRequest(
        @NotBlank @Size(max = 100) String name,
        @NotNull @Min(20) @Max(60) Integer durationMinutes
) {}
