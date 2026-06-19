package com.hospital.laboratory.attachment;

import com.hospital.exception.BusinessRuleException;
import com.hospital.storage.StorageProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AttachmentValidationServiceTest {

    private AttachmentValidationService validationService;

    @BeforeEach
    void setUp() {
        StorageProperties properties = new StorageProperties();
        properties.setMaxAttachmentBytes(10_485_760L);
        validationService = new AttachmentValidationService(properties);
    }

    @Test
    void validate_acceptsPdf() {
        byte[] pdf = "%PDF-1.4 test".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file", "resultado.pdf", "application/pdf", pdf);

        AttachmentValidationService.ValidatedAttachment validated = validationService.validate(file);

        assertEquals("resultado.pdf", validated.originalFileName());
        assertEquals("application/pdf", validated.contentType());
    }

    @Test
    void validate_rejectsOversizedFile() {
        byte[] pdf = "%PDF".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file", "grande.pdf", "application/pdf", pdf) {
            @Override
            public long getSize() {
                return 10_485_761L;
            }
        };

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> validationService.validate(file));
        assertEquals("El archivo supera el tamaño máximo permitido (10 MB).", ex.getMessage());
    }

    @Test
    void validate_rejectsInvalidContent() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "falso.pdf", "application/pdf", "not-a-pdf".getBytes());

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> validationService.validate(file));
        assertEquals("El contenido del archivo no es un PDF o imagen válida.", ex.getMessage());
    }

    @Test
    void detectContentType_recognizesPng() {
        byte[] png = new byte[] {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
        assertEquals("image/png", AttachmentValidationService.detectContentType(png));
    }
}
