package com.hospital.laboratory.attachment;

import com.hospital.auditlog.BusinessAuditActions;
import com.hospital.auditlog.BusinessAuditRecorder;
import com.hospital.exception.BusinessRuleException;
import com.hospital.exception.ResourceNotFoundException;
import com.hospital.laboratory.dto.LaboratoryAttachmentMetadataResponse;
import com.hospital.laboratory.dto.LaboratoryResponse;
import com.hospital.laboratory.entity.Laboratory;
import com.hospital.laboratory.repository.LaboratoryRepository;
import com.hospital.laboratory.service.LaboratoryService;
import com.hospital.security.SecurityContextHelper;
import com.hospital.storage.StorageService;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class LaboratoryAttachmentService {

    private final LaboratoryRepository laboratoryRepository;
    private final LaboratoryService laboratoryService;
    private final StorageService storageService;
    private final AttachmentValidationService attachmentValidationService;
    private final LaboratoryAttachmentCodec attachmentCodec;
    private final BusinessAuditRecorder businessAuditRecorder;
    private final SecurityContextHelper securityContextHelper;

    public LaboratoryAttachmentService(
            LaboratoryRepository laboratoryRepository,
            LaboratoryService laboratoryService,
            StorageService storageService,
            AttachmentValidationService attachmentValidationService,
            LaboratoryAttachmentCodec attachmentCodec,
            BusinessAuditRecorder businessAuditRecorder,
            SecurityContextHelper securityContextHelper) {
        this.laboratoryRepository = laboratoryRepository;
        this.laboratoryService = laboratoryService;
        this.storageService = storageService;
        this.attachmentValidationService = attachmentValidationService;
        this.attachmentCodec = attachmentCodec;
        this.businessAuditRecorder = businessAuditRecorder;
        this.securityContextHelper = securityContextHelper;
    }

    @Transactional(readOnly = true)
    public LaboratoryAttachmentMetadataResponse getMetadata(Long laboratoryId) {
        Laboratory lab = findLaboratory(laboratoryId);
        LaboratoryAttachmentMetadata metadata = attachmentCodec.parse(lab.getAttachment());
        if (metadata == null) {
            throw new ResourceNotFoundException("Este registro de laboratorio no tiene adjunto.");
        }
        return attachmentCodec.toResponse(metadata);
    }

    @Transactional
    public LaboratoryResponse upload(Long laboratoryId, MultipartFile file) {
        AttachmentValidationService.ValidatedAttachment validated = attachmentValidationService.validate(file);
        Laboratory lab = findLaboratory(laboratoryId);
        LaboratoryAttachmentMetadata previous = attachmentCodec.parse(lab.getAttachment());

        String storageKey = buildStorageKey(laboratoryId, validated.originalFileName());
        try (InputStream input = file.getInputStream()) {
            storageService.store(storageKey, input, validated.sizeBytes(), validated.contentType());
        } catch (BusinessRuleException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessRuleException("No se pudo procesar el archivo adjunto.");
        }

        LaboratoryAttachmentMetadata metadata = new LaboratoryAttachmentMetadata(
                storageKey,
                validated.originalFileName(),
                validated.contentType(),
                validated.sizeBytes(),
                LocalDateTime.now(),
                securityContextHelper.currentUserIdOrNull());

        try {
            lab.setAttachment(attachmentCodec.serialize(metadata));
            laboratoryRepository.save(lab);
            if (previous != null && !previous.storageKey().equals(storageKey)) {
                safeDeleteStorage(previous.storageKey());
            }
        } catch (Exception e) {
            safeDeleteStorage(storageKey);
            throw e;
        }

        recordAudit(laboratoryId, previous == null ? "ATTACHMENT_UPLOAD" : "ATTACHMENT_REPLACE", metadata);
        return laboratoryService.findById(laboratoryId);
    }

    @Transactional(readOnly = true)
    public ResponseEntity<Resource> download(Long laboratoryId) {
        Laboratory lab = findLaboratory(laboratoryId);
        LaboratoryAttachmentMetadata metadata = attachmentCodec.parse(lab.getAttachment());
        if (metadata == null) {
            throw new ResourceNotFoundException("Este registro de laboratorio no tiene adjunto.");
        }
        InputStream stream = storageService.read(metadata.storageKey());
        recordAudit(laboratoryId, "ATTACHMENT_DOWNLOAD", metadata);
        Resource resource = new InputStreamResource(stream);
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(metadata.originalFileName(), StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .contentType(MediaType.parseMediaType(metadata.contentType()))
                .contentLength(metadata.sizeBytes())
                .body(resource);
    }

    @Transactional
    public void delete(Long laboratoryId) {
        Laboratory lab = findLaboratory(laboratoryId);
        if ("COMPLETADO".equalsIgnoreCase(lab.getStatus())) {
            throw new BusinessRuleException(
                    "No se puede eliminar el adjunto de un registro en estado COMPLETADO.");
        }
        LaboratoryAttachmentMetadata metadata = attachmentCodec.parse(lab.getAttachment());
        if (metadata == null) {
            throw new ResourceNotFoundException("Este registro de laboratorio no tiene adjunto.");
        }
        lab.setAttachment(null);
        laboratoryRepository.save(lab);
        safeDeleteStorage(metadata.storageKey());
        recordAudit(laboratoryId, "ATTACHMENT_DELETE", metadata);
    }

    private Laboratory findLaboratory(Long laboratoryId) {
        return laboratoryRepository.findById(laboratoryId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No se encontró el registro de laboratorio: " + laboratoryId));
    }

    private static String buildStorageKey(Long laboratoryId, String originalFileName) {
        return "laboratory/" + laboratoryId + "/" + UUID.randomUUID() + "-" + originalFileName;
    }

    private void safeDeleteStorage(String storageKey) {
        try {
            storageService.delete(storageKey);
        } catch (RuntimeException ignored) {
            // La operación principal ya se completó; limpieza best-effort.
        }
    }

    private void recordAudit(Long laboratoryId, String action, LaboratoryAttachmentMetadata metadata) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("laboratoryId", laboratoryId);
        payload.put("originalFileName", metadata.originalFileName());
        payload.put("contentType", metadata.contentType());
        payload.put("sizeBytes", metadata.sizeBytes());
        businessAuditRecorder.safeRecord(
                "laboratory",
                "LaboratoryAttachment",
                String.valueOf(laboratoryId),
                action,
                null,
                payload);
    }
}
