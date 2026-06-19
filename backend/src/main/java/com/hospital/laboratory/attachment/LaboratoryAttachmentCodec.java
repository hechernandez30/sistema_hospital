package com.hospital.laboratory.attachment;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hospital.laboratory.dto.LaboratoryAttachmentMetadataResponse;
import org.springframework.stereotype.Component;

@Component
public class LaboratoryAttachmentCodec {

    private final ObjectMapper objectMapper;

    public LaboratoryAttachmentCodec(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public LaboratoryAttachmentMetadata parse(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String trimmed = raw.trim();
        if (!trimmed.startsWith("{")) {
            return null;
        }
        try {
            LaboratoryAttachmentMetadata meta = objectMapper.readValue(trimmed, LaboratoryAttachmentMetadata.class);
            return isValid(meta) ? meta : null;
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    public String serialize(LaboratoryAttachmentMetadata metadata) {
        try {
            return objectMapper.writeValueAsString(metadata);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("No se pudo serializar metadatos de adjunto", e);
        }
    }

    public boolean hasValidAttachment(String raw) {
        return parse(raw) != null;
    }

    public LaboratoryAttachmentMetadataResponse toResponse(LaboratoryAttachmentMetadata metadata) {
        if (metadata == null) {
            return null;
        }
        return new LaboratoryAttachmentMetadataResponse(
                metadata.originalFileName(),
                metadata.contentType(),
                metadata.sizeBytes(),
                metadata.uploadedAt(),
                metadata.uploadedByUserId());
    }

    private static boolean isValid(LaboratoryAttachmentMetadata meta) {
        return meta != null
                && meta.storageKey() != null
                && !meta.storageKey().isBlank()
                && meta.originalFileName() != null
                && !meta.originalFileName().isBlank()
                && meta.contentType() != null
                && !meta.contentType().isBlank()
                && meta.sizeBytes() > 0
                && meta.uploadedAt() != null;
    }
}
