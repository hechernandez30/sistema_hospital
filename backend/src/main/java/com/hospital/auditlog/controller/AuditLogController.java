package com.hospital.auditlog.controller;

import com.hospital.auditlog.dto.AuditLogResponse;
import com.hospital.auditlog.service.AuditLogService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public List<AuditLogResponse> list(
            @RequestParam(required = false) String module,
            @RequestParam(required = false) Long userId) {
        return auditLogService.findAll(module, userId);
    }

    @GetMapping("/{id}")
    public AuditLogResponse get(@PathVariable Long id) {
        return auditLogService.findById(id);
    }
}
