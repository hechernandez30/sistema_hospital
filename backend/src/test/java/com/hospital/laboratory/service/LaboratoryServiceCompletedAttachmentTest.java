package com.hospital.laboratory.service;

import com.hospital.auditlog.BusinessAuditRecorder;
import com.hospital.exception.BusinessRuleException;
import com.hospital.laboratory.attachment.LaboratoryAttachmentCodec;
import com.hospital.laboratory.dto.LaboratoryUpdateRequest;
import com.hospital.laboratory.entity.Laboratory;
import com.hospital.laboratory.repository.LaboratoryRepository;
import com.hospital.medicalorder.entity.MedicalOrder;
import com.hospital.medicalorder.repository.MedicalOrderRepository;
import com.hospital.staff.repository.StaffRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LaboratoryServiceCompletedAttachmentTest {

    @Mock
    private LaboratoryRepository laboratoryRepository;

    @Mock
    private MedicalOrderRepository medicalOrderRepository;

    @Mock
    private StaffRepository staffRepository;

    @Mock
    private BusinessAuditRecorder businessAuditRecorder;

    @Spy
    private LaboratoryAttachmentCodec attachmentCodec = new LaboratoryAttachmentCodec(
            new ObjectMapper().findAndRegisterModules());

    @InjectMocks
    private LaboratoryService laboratoryService;

    private Laboratory lab;

    @BeforeEach
    void setUp() {
        MedicalOrder order = new MedicalOrder();
        order.setId(10L);
        order.setOrderType("LABORATORIO");

        lab = new Laboratory();
        lab.setId(1L);
        lab.setMedicalOrder(order);
        lab.setStatus("EN_PROCESO");
        lab.setSampleReceived(true);
    }

    @Test
    void update_toCompletedWithoutAttachment_isRejected() {
        when(laboratoryRepository.findById(1L)).thenReturn(Optional.of(lab));

        LaboratoryUpdateRequest request = new LaboratoryUpdateRequest(
                null, null, null, null, true, null, null, null, null,
                "COMPLETADO", null, null, null);

        BusinessRuleException ex =
                assertThrows(BusinessRuleException.class, () -> laboratoryService.update(1L, request));

        assertEquals(
                "Para marcar como COMPLETADO debe adjuntar un archivo de resultado (PDF o imagen) mediante POST /api/laboratory/{id}/attachment.",
                ex.getMessage());
        verify(laboratoryRepository, never()).save(any());
    }

    @Test
    void update_toCompletedWithAttachment_isAllowed() {
        lab.setAttachment(
                """
                {"storageKey":"laboratory/1/a.pdf","originalFileName":"a.pdf","contentType":"application/pdf","sizeBytes":10,"uploadedAt":"2026-05-30T10:00:00","uploadedByUserId":2}
                """);
        when(laboratoryRepository.findById(1L)).thenReturn(Optional.of(lab));
        when(laboratoryRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        LaboratoryUpdateRequest request = new LaboratoryUpdateRequest(
                null, null, null, null, true, null, null, null, null,
                "COMPLETADO", null, null, null);

        laboratoryService.update(1L, request);

        verify(laboratoryRepository).save(any());
    }
}
