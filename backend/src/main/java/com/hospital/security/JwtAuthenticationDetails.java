package com.hospital.security;

/**
 * Detalles del contexto de autenticación JWT para auditoría y diagnóstico.
 */
public record JwtAuthenticationDetails(Long userId, String username) {
}
