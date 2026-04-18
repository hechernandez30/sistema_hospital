package com.hospital.user.dto;

import java.time.LocalDateTime;

public record UserResponse(
        Long id,
        Long roleId,
        String username,
        String email,
        String firstName,
        String lastName,
        String state,
        boolean mfaEnabled,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
