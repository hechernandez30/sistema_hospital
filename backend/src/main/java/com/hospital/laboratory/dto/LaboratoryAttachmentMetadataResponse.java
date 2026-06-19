package com.hospital.laboratory.dto;

import java.time.LocalDateTime;

/** Metadatos de adjunto expuestos en API (sin clave interna de almacenamiento). */
public record LaboratoryAttachmentMetadataResponse(
        String originalFileName,
        String contentType,
        long sizeBytes,
        LocalDateTime uploadedAt,
        Long uploadedByUserId
) {}
