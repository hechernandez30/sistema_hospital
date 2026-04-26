package com.hospital.security;

import com.hospital.auditlog.dto.AuditLogCreateRequest;
import com.hospital.auditlog.service.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SecurityAuditService {

    private static final Logger log = LoggerFactory.getLogger(SecurityAuditService.class);
    private static final String MODULE = "security";
    private static final String ENTITY_TYPE = "SecurityEvent";
    private static final int RECORD_ID_MAX = 100;

    private final AuditLogService auditLogService;

    public SecurityAuditService(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordLoginSuccess(Long userId, String username, HttpServletRequest request) {
        safeRecord(() -> auditLogService.recordEvent(new AuditLogCreateRequest(
                userId,
                MODULE,
                ENTITY_TYPE,
                truncate(username),
                SecurityAuditActions.LOGIN_SUCCESS,
                null,
                baseDetails(username, request),
                clientIp(request))));
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordLoginFailure(String username, HttpServletRequest request) {
        safeRecord(() -> auditLogService.recordEvent(new AuditLogCreateRequest(
                null,
                MODULE,
                ENTITY_TYPE,
                truncate(username),
                SecurityAuditActions.LOGIN_FAILURE,
                null,
                baseDetails(username, request),
                clientIp(request))));
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordAccessDenied(
            Long userId,
            String username,
            HttpServletRequest request,
            String path,
            String rolesSummary) {
        safeRecord(() -> {
            Map<String, Object> data = baseDetails(username, request);
            data.put("path", path);
            data.put("authorities", rolesSummary);
            auditLogService.recordEvent(new AuditLogCreateRequest(
                    userId,
                    MODULE,
                    ENTITY_TYPE,
                    truncate(path != null ? path : "unknown"),
                    SecurityAuditActions.ACCESS_DENIED,
                    null,
                    data,
                    clientIp(request)));
        });
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordJwtInvalid(HttpServletRequest request, String path, String message) {
        safeRecord(() -> {
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("path", path);
            if (message != null && !message.isBlank()) {
                data.put("reason", message);
            }
            auditLogService.recordEvent(new AuditLogCreateRequest(
                    null,
                    MODULE,
                    ENTITY_TYPE,
                    truncate(path != null ? path : "unknown"),
                    SecurityAuditActions.JWT_INVALID,
                    null,
                    data,
                    clientIp(request)));
        });
    }

    private void safeRecord(Runnable write) {
        try {
            write.run();
        } catch (Exception e) {
            log.warn("Security audit record failed: {}", e.getMessage());
        }
    }

    private static Map<String, Object> baseDetails(String username, HttpServletRequest request) {
        Map<String, Object> m = new LinkedHashMap<>();
        if (username != null && !username.isBlank()) {
            m.put("username", username);
        }
        m.put("method", request.getMethod());
        return m;
    }

    private static String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private static String truncate(String value) {
        if (value == null) {
            return "unknown";
        }
        String t = value.trim();
        if (t.length() <= RECORD_ID_MAX) {
            return t;
        }
        return t.substring(0, RECORD_ID_MAX);
    }

    public static String authoritiesSummary(org.springframework.security.core.Authentication authentication) {
        if (authentication == null || authentication.getAuthorities() == null) {
            return "";
        }
        return authentication.getAuthorities().stream()
                .map(a -> a.getAuthority())
                .collect(Collectors.joining(","));
    }
}
