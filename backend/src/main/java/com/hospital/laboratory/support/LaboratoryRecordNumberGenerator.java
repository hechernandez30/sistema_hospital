package com.hospital.laboratory.support;

import java.time.LocalDate;
import java.util.Collection;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * CU06 RN02/RN03: correlativo AAAA-MM-DD-CC-NNNNNNN (CC = MM muestra médica, LQ laboratorio clínico).
 */
public final class LaboratoryRecordNumberGenerator {

    private static final Pattern LAB_RECORD_NUM =
            Pattern.compile("^(\\d{4})-(\\d{2})-(\\d{2})-([A-Za-z]{2})-(\\d{7,10})$");

    private LaboratoryRecordNumberGenerator() {}

    public static String ccFromRequestType(String requestType) {
        if ("MUESTRA_MEDICA".equalsIgnoreCase(requestType != null ? requestType.trim() : "")) {
            return "MM";
        }
        return "LQ";
    }

    public static String nextFromExisting(Collection<String> existingRecordNumbers, String requestType, LocalDate date) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        String cc = ccFromRequestType(requestType);
        String prefix = String.format(
                "%d-%02d-%02d-%s-",
                targetDate.getYear(), targetDate.getMonthValue(), targetDate.getDayOfMonth(), cc);

        int max = 0;
        if (existingRecordNumbers != null) {
            for (String raw : existingRecordNumbers) {
                if (raw == null || raw.isBlank()) {
                    continue;
                }
                Matcher matcher = LAB_RECORD_NUM.matcher(raw.trim());
                if (!matcher.matches()) {
                    continue;
                }
                String recordPrefix = String.format(
                        "%s-%s-%s-%s-",
                        matcher.group(1),
                        matcher.group(2),
                        matcher.group(3),
                        matcher.group(4).toUpperCase());
                if (!recordPrefix.equals(prefix)) {
                    continue;
                }
                int n = Integer.parseInt(matcher.group(5));
                if (n > max) {
                    max = n;
                }
            }
        }
        return prefix + String.format("%07d", max + 1);
    }
}
