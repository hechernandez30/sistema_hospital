package com.hospital.laboratory.attachment;

import com.hospital.exception.BusinessRuleException;
import com.hospital.storage.StorageProperties;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;
import java.util.Set;

@Service
public class AttachmentValidationService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/webp");

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("pdf", "jpg", "jpeg", "png", "webp");

    private final long maxBytes;

    public AttachmentValidationService(StorageProperties storageProperties) {
        this.maxBytes = storageProperties.getMaxAttachmentBytes();
    }

    public ValidatedAttachment validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessRuleException("Debe enviar un archivo adjunto.");
        }
        if (file.getSize() > maxBytes) {
            throw new BusinessRuleException("El archivo supera el tamaño máximo permitido (10 MB).");
        }
        String originalName = file.getOriginalFilename();
        if (originalName == null || originalName.isBlank()) {
            throw new BusinessRuleException("El nombre del archivo es obligatorio.");
        }
        String extension = extensionOf(originalName);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BusinessRuleException("Tipo de archivo no permitido. Use PDF o imagen (JPEG, PNG, WebP).");
        }
        String declaredType = normalizeContentType(file.getContentType());
        byte[] header;
        try {
            header = file.getInputStream().readNBytes(12);
        } catch (IOException e) {
            throw new BusinessRuleException("No se pudo leer el archivo adjunto.");
        }
        String detectedType = detectContentType(header);
        if (detectedType == null || !ALLOWED_CONTENT_TYPES.contains(detectedType)) {
            throw new BusinessRuleException("El contenido del archivo no es un PDF o imagen válida.");
        }
        if (declaredType != null && !declaredType.equals(detectedType) && !compatible(declaredType, detectedType)) {
            throw new BusinessRuleException("El tipo declarado del archivo no coincide con su contenido real.");
        }
        return new ValidatedAttachment(sanitizeFileName(originalName), detectedType, file.getSize());
    }

    private static boolean compatible(String declared, String detected) {
        if ("image/jpeg".equals(declared) && "image/jpeg".equals(detected)) {
            return true;
        }
        return declared.equals(detected);
    }

    private static String extensionOf(String fileName) {
        int dot = fileName.lastIndexOf('.');
        if (dot < 0 || dot == fileName.length() - 1) {
            return "";
        }
        return fileName.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    private static String normalizeContentType(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        return raw.split(";")[0].trim().toLowerCase(Locale.ROOT);
    }

    static String detectContentType(byte[] header) {
        if (header.length >= 4
                && header[0] == '%'
                && header[1] == 'P'
                && header[2] == 'D'
                && header[3] == 'F') {
            return "application/pdf";
        }
        if (header.length >= 3 && (header[0] & 0xFF) == 0xFF && (header[1] & 0xFF) == 0xD8 && (header[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }
        if (header.length >= 8
                && (header[0] & 0xFF) == 0x89
                && header[1] == 'P'
                && header[2] == 'N'
                && header[3] == 'G') {
            return "image/png";
        }
        if (header.length >= 12
                && header[0] == 'R'
                && header[1] == 'I'
                && header[2] == 'F'
                && header[3] == 'F'
                && header[8] == 'W'
                && header[9] == 'E'
                && header[10] == 'B'
                && header[11] == 'P') {
            return "image/webp";
        }
        return null;
    }

    static String sanitizeFileName(String original) {
        String base = original.replace('\\', '/');
        int slash = base.lastIndexOf('/');
        if (slash >= 0) {
            base = base.substring(slash + 1);
        }
        String cleaned = base.replaceAll("[^a-zA-Z0-9._-]", "_");
        if (cleaned.isBlank()) {
            return "adjunto";
        }
        return cleaned.length() > 200 ? cleaned.substring(0, 200) : cleaned;
    }

    public record ValidatedAttachment(String originalFileName, String contentType, long sizeBytes) {}
}
