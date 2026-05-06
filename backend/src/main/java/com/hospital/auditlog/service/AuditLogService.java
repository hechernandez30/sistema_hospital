package com.hospital.auditlog.service;

import com.hospital.auditlog.dto.AuditLogCreateRequest;
import com.hospital.auditlog.dto.AuditLogResponse;
import com.hospital.auditlog.entity.AuditLog;
import com.hospital.auditlog.repository.AuditLogRepository;
import com.hospital.exception.BusinessRuleException;
import com.hospital.exception.ResourceNotFoundException;
import com.hospital.user.entity.User;
import com.hospital.user.repository.UserRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.List;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public AuditLogService(AuditLogRepository auditLogRepository, UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> findAll(String module, Long userId) {
        if (module != null && !module.isBlank()) {
            return auditLogRepository.findByModuleOrderByOccurredAtDesc(module.trim()).stream()
                    .map(this::toResponse)
                    .toList();
        }
        if (userId != null) {
            return auditLogRepository.findByUser_IdOrderByOccurredAtDesc(userId).stream()
                    .map(this::toResponse)
                    .toList();
        }
        return auditLogRepository.findAll(Sort.by(Sort.Direction.DESC, "occurredAt")).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public AuditLogResponse findById(Long id) {
        return toResponse(auditLogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el registro de bitácora: " + id)));
    }

    /**
     * Registro interno de auditoría (no expuesto como flujo principal vía HTTP).
     */
    @Transactional
    public void recordEvent(AuditLogCreateRequest request) {
        AuditLog log = new AuditLog();
        log.setUser(resolveUser(request.userId()));
        log.setModule(request.module().trim());
        log.setEntityType(request.entityType().trim());
        log.setRecordId(request.recordId().trim());
        log.setAction(request.action().trim());
        log.setPreviousData(request.previousData());
        log.setNewData(request.newData());
        log.setClientAddress(parseClientIp(request.clientIp()));
        auditLogRepository.save(log);
    }

    private User resolveUser(Long userId) {
        if (userId == null) {
            return null;
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el usuario: " + userId));
    }

    private InetAddress parseClientIp(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return InetAddress.getByName(raw.trim());
        } catch (UnknownHostException e) {
            throw new BusinessRuleException("Dirección IP no válida: " + raw);
        }
    }

    private AuditLogResponse toResponse(AuditLog log) {
        return new AuditLogResponse(
                log.getId(),
                log.getUser() != null ? log.getUser().getId() : null,
                log.getModule(),
                log.getEntityType(),
                log.getRecordId(),
                log.getAction(),
                log.getPreviousData(),
                log.getNewData(),
                log.getOccurredAt(),
                log.getClientAddress() != null ? log.getClientAddress().getHostAddress() : null);
    }
}
