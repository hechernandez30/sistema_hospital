package com.hospital.patient.service;

import com.hospital.auditlog.BusinessAuditActions;
import com.hospital.auditlog.BusinessAuditRecorder;
import com.hospital.patient.entity.Patient;
import com.hospital.patient.repository.PatientRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PatientServiceSoftDeleteTest {

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private BusinessAuditRecorder businessAuditRecorder;

    @InjectMocks
    private PatientService patientService;

    @Test
    void delete_usesDeactivateById_neverPhysicalDelete() {
        Patient active = samplePatient(7L, true);
        Patient inactive = samplePatient(7L, false);

        when(patientRepository.findById(7L)).thenReturn(Optional.of(active), Optional.of(inactive));
        when(patientRepository.deactivateById(7L)).thenReturn(1);

        patientService.delete(7L);

        verify(patientRepository).deactivateById(7L);
        verify(patientRepository, never()).delete(any());
        verify(patientRepository, never()).deleteById(any());
        verify(patientRepository, never()).deleteAll();
        verify(businessAuditRecorder).safeRecord(
                eq("patients"),
                eq("Patient"),
                eq("7"),
                eq(BusinessAuditActions.UPDATE),
                any(),
                any());
    }

    @Test
    void delete_whenAlreadyInactive_isNoOp() {
        Patient inactive = samplePatient(3L, false);
        when(patientRepository.findById(3L)).thenReturn(Optional.of(inactive));

        patientService.delete(3L);

        verify(patientRepository, never()).deactivateById(any());
        verify(patientRepository, never()).delete(any());
        verify(businessAuditRecorder, never()).safeRecord(any(), any(), any(), any(), any(), any());
    }

    private static Patient samplePatient(Long id, boolean active) {
        Patient p = new Patient();
        p.setId(id);
        p.setPatientCode("P-TEST");
        p.setFirstName("Ana");
        p.setLastName("López");
        p.setDpiNit("1234567890101");
        p.setBirthDate(LocalDate.of(1990, 1, 1));
        p.setActive(active);
        return p;
    }
}
