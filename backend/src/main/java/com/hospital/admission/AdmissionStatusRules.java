package com.hospital.admission;

import java.util.Set;

/** Reglas de estado de admisión compartidas entre módulos asistenciales. */
public final class AdmissionStatusRules {

    public static final Set<String> ALL_STATUSES = Set.of(
            "PENDIENTE", "ADMITIDO", "ALTA", "TRANSFERIDO", "RECHAZADO", "ANULADO");

    private AdmissionStatusRules() {
    }

    /** Admisión cerrada para nuevos triage, atenciones, pagos u otros flujos asistenciales. */
    public static boolean isClosedForNewAssistance(String status) {
        if (status == null) {
            return false;
        }
        String s = status.trim().toUpperCase();
        return "RECHAZADO".equals(s) || "ANULADO".equals(s);
    }
}
