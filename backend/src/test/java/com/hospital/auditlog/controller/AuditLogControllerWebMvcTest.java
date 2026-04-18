package com.hospital.auditlog.controller;

import com.hospital.auditlog.dto.AuditLogResponse;
import com.hospital.auditlog.service.AuditLogService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AuditLogController.class)
class AuditLogControllerWebMvcTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuditLogService auditLogService;

    @Test
    void listAuditLogsReturnsOk() throws Exception {
        AuditLogResponse row = new AuditLogResponse(
                1L,
                1L,
                "patients",
                "Patient",
                "1",
                "CREATE",
                null,
                Map.of("id", 1),
                LocalDateTime.now(),
                "127.0.0.1");
        when(auditLogService.findAll(isNull(), isNull())).thenReturn(List.of(row));

        mockMvc.perform(get("/api/audit-logs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].module").value("patients"));
    }

    @Test
    void listWithModuleUsesService() throws Exception {
        when(auditLogService.findAll(eq("payments"), isNull())).thenReturn(List.of());

        mockMvc.perform(get("/api/audit-logs").param("module", "payments"))
                .andExpect(status().isOk());
    }
}
