package com.hospital.auditlog;

import com.hospital.auditlog.dto.AuditLogCreateRequest;
import com.hospital.auditlog.service.AuditLogService;
import com.hospital.security.JwtAuthenticationDetails;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Map;

/**
 * Registra eventos de negocio en la bitácora existente; fallos de escritura no interrumpen la operación principal.
 */
@Component
public class BusinessAuditRecorder {

    private static final Logger log = LoggerFactory.getLogger(BusinessAuditRecorder.class);
    private static final int MAX_FIELD = 100;

    private final AuditLogService auditLogService;

    public BusinessAuditRecorder(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    /**
     * @param module     nombre estable del módulo (p. ej. {@code admissions}, {@code payments})
     * @param entityType tipo de entidad de negocio
     * @param recordId   identificador del registro afectado (se trunca a 100 caracteres)
     */
    public void safeRecord(
            String module,
            String entityType,
            String recordId,
            String action,
            Map<String, Object> previousData,
            Map<String, Object> newData) {
        try {
            auditLogService.recordEvent(new AuditLogCreateRequest(
                    currentUserIdOrNull(),
                    truncate(module),
                    truncate(entityType),
                    truncate(recordId),
                    truncate(action),
                    previousData,
                    newData,
                    clientIpOrNull()));
        } catch (Exception e) {
            log.warn(
                    "Auditoría de negocio no registrada ({} {} {}): {}",
                    truncate(module),
                    truncate(entityType),
                    truncate(action),
                    e.getMessage());
        }
    }

    private static Long currentUserIdOrNull() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getDetails() instanceof JwtAuthenticationDetails details)) {
            return null;
        }
        return details.userId();
    }

    private static String clientIpOrNull() {
        try {
            var attrs = RequestContextHolder.getRequestAttributes();
            if (!(attrs instanceof ServletRequestAttributes servletAttributes)) {
                return null;
            }
            HttpServletRequest request = servletAttributes.getRequest();
            String forwarded = request.getHeader("X-Forwarded-For");
            if (forwarded != null && !forwarded.isBlank()) {
                return forwarded.split(",")[0].trim();
            }
            return request.getRemoteAddr();
        } catch (Exception e) {
            return null;
        }
    }

    private static String truncate(String value) {
        if (value == null) {
            return "";
        }
        String t = value.trim();
        if (t.length() <= MAX_FIELD) {
            return t;
        }
        return t.substring(0, MAX_FIELD);
    }
}
