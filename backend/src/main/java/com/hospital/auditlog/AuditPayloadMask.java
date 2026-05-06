package com.hospital.auditlog;

/**
 * Enmascarado liviano para campos repetibles en payloads de auditoría (DPI/NIT, pólizas).
 */
public final class AuditPayloadMask {

    private AuditPayloadMask() {
    }

    /** Oculta la mayor parte del valor; deja solo un sufijo corto cuando aplica. */
    public static String tailMask(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String v = value.trim();
        int n = v.length();
        if (n <= 2) {
            return "***";
        }
        int keep = Math.min(4, n);
        return "…" + v.substring(n - keep);
    }
}
