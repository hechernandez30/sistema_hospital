package com.hospital.testsupport;

import com.hospital.security.SecurityAuditService;
import org.mockito.Mockito;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

/**
 * Evita cargar persistencia de bitácora en {@code @WebMvcTest}; la auditoría de seguridad se simula.
 */
@TestConfiguration
public class TestSecurityAuditConfig {

    @Bean
    @Primary
    public SecurityAuditService securityAuditService() {
        return Mockito.mock(SecurityAuditService.class);
    }
}
