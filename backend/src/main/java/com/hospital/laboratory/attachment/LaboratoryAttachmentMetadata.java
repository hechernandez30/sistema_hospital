package com.hospital.laboratory.attachment;

import java.time.LocalDateTime;

/**
 * Metadatos persistidos en {@code laboratorio.adjunto} como JSON (opción A — sin tabla nueva).
 */
public record LaboratoryAttachmentMetadata(
        String storageKey,
        String originalFileName,
        String contentType,
        long sizeBytes,
        LocalDateTime uploadedAt,
        Long uploadedByUserId
) {}
