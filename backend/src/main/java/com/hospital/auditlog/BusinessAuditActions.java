package com.hospital.auditlog;

/**
 * Acciones de auditoría para operaciones de negocio (módulos distintos de {@code security}).
 */
public final class BusinessAuditActions {

    public static final String CREATE = "CREATE";
    public static final String UPDATE = "UPDATE";
    public static final String DELETE = "DELETE";

    private BusinessAuditActions() {
    }
}
