package com.hospital.patient.controller;

import com.hospital.patient.dto.PatientResponse;
import com.hospital.patient.service.PatientService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = PatientController.class)
class PatientControllerWebMvcTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PatientService patientService;

    @Test
    void listPatientsReturnsOk() throws Exception {
        PatientResponse row = new PatientResponse(
                1L,
                "P-001",
                "Ana",
                "López",
                "1234567890101",
                LocalDate.of(1990, 1, 1),
                "F",
                null,
                null,
                null,
                null,
                null,
                true,
                null,
                null,
                null,
                null,
                true,
                LocalDateTime.now(),
                LocalDateTime.now());
        when(patientService.findAll()).thenReturn(List.of(row));

        mockMvc.perform(get("/api/patients"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].patientCode").value("P-001"));
    }
}
