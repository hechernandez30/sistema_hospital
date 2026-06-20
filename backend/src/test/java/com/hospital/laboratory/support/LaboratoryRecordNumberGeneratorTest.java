package com.hospital.laboratory.support;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class LaboratoryRecordNumberGeneratorTest {

    private static final LocalDate DATE = LocalDate.of(2026, 5, 30);

    @Test
    void nextFromExisting_startsAtOne_whenNoMatches() {
        assertEquals(
                "2026-05-30-LQ-0000001",
                LaboratoryRecordNumberGenerator.nextFromExisting(List.of("Pendiente", "invalid"), null, DATE));
    }

    @Test
    void nextFromExisting_incrementsSameDayAndType() {
        List<String> existing = List.of("2026-05-30-LQ-0000003", "2026-05-30-LQ-0000001");
        assertEquals(
                "2026-05-30-LQ-0000004",
                LaboratoryRecordNumberGenerator.nextFromExisting(existing, "LABORATORIO", DATE));
    }

    @Test
    void nextFromExisting_usesMmForMedicalSample() {
        assertEquals(
                "2026-05-30-MM-0000002",
                LaboratoryRecordNumberGenerator.nextFromExisting(List.of("2026-05-30-MM-0000001"), "MUESTRA_MEDICA", DATE));
    }

    @Test
    void ccFromRequestType_mapsKnownValues() {
        assertEquals("MM", LaboratoryRecordNumberGenerator.ccFromRequestType("MUESTRA_MEDICA"));
        assertEquals("LQ", LaboratoryRecordNumberGenerator.ccFromRequestType("LABORATORIO"));
        assertEquals("LQ", LaboratoryRecordNumberGenerator.ccFromRequestType(null));
    }
}
