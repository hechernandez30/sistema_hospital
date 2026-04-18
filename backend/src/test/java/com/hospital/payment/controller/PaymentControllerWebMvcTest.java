package com.hospital.payment.controller;

import com.hospital.payment.dto.PaymentResponse;
import com.hospital.payment.service.PaymentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = PaymentController.class)
class PaymentControllerWebMvcTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PaymentService paymentService;

    @Test
    void listPaymentsReturnsOk() throws Exception {
        PaymentResponse row = new PaymentResponse(
                1L,
                1L,
                null,
                null,
                "Consulta",
                new BigDecimal("100.00"),
                new BigDecimal("80.00"),
                new BigDecimal("80.00"),
                BigDecimal.ZERO,
                new BigDecimal("20.00"),
                "EFECTIVO",
                "PAGADO",
                "R-001",
                LocalDateTime.now(),
                1L);
        when(paymentService.findAll()).thenReturn(List.of(row));

        mockMvc.perform(get("/api/payments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].concept").value("Consulta"));
    }
}
