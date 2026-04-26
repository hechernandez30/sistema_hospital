package com.hospital.security;

public final class SecurityAuditActions {

    public static final String LOGIN_SUCCESS = "LOGIN_SUCCESS";
    public static final String LOGIN_FAILURE = "LOGIN_FAILURE";
    public static final String ACCESS_DENIED = "ACCESS_DENIED";
    public static final String JWT_INVALID = "JWT_INVALID";

    private SecurityAuditActions() {
    }
}
