package com.hospital.admission;

import java.util.Set;

/** Reglas de estado de admisión compartidas entre módulos asistenciales. */
public final class AdmissionStatusRules {

    public static final Set<String> ALL_STATUSES = Set.of(
            "PENDIENTE", "ADMITIDO", "ALTA", "TRANSFERIDO", "RECHAZADO", "ANULADO");

    /** Estados de admisión que generan atención médica pendiente al crear el episodio. */
    public static final Set<String> AUTO_MEDICAL_CARE_STATUSES = Set.of("PENDIENTE", "ADMITIDO", "TRANSFERIDO");

    private AdmissionStatusRules() {
    }

    public static boolean triggersAutoMedicalCare(String status) {
        if (status == null) {
            return false;
        }
        return AUTO_MEDICAL_CARE_STATUSES.contains(status.trim().toUpperCase());
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
