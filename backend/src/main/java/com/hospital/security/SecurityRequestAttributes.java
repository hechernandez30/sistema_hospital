package com.hospital.security;

/**
 * Atributos de petición usados entre el filtro JWT y el {@code AuthenticationEntryPoint}.
 */
public final class SecurityRequestAttributes {

    public static final String AUTH_FAILURE = "com.hospital.security.authFailure";

    /** Valor cuando el JWT es inválido o expiró (frente a ausencia de token). */
    public static final String FAILURE_JWT_INVALID = "JWT_INVALID";

    private SecurityRequestAttributes() {
    }
}
