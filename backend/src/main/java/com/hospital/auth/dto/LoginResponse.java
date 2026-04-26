package com.hospital.auth.dto;

import java.util.List;

public record LoginResponse(Long userId, String username, List<String> roles, String accessToken) {
}
