package com.hospital.testsupport;

import com.hospital.config.CryptoConfig;
import com.hospital.security.HospitalPublicEndpointMatcher;
import com.hospital.security.JwtAuthenticationFilter;
import com.hospital.security.JwtTokenService;
import com.hospital.security.RestAccessDeniedHandler;
import com.hospital.security.RestAuthenticationEntryPoint;
import com.hospital.security.config.SecurityConfig;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Activa perfil {@code test} ({@code app.security.enabled=false}) e importa la cadena de seguridad
 * para que {@code @WebMvcTest} levante los mismos beans que la aplicación (JWT no exige token en test).
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@ActiveProfiles("test")
@Import({
        SecurityConfig.class,
        CryptoConfig.class,
        JwtAuthenticationFilter.class,
        JwtTokenService.class,
        HospitalPublicEndpointMatcher.class,
        RestAuthenticationEntryPoint.class,
        RestAccessDeniedHandler.class,
        TestSecurityAuditConfig.class
})
public @interface HospitalWebMvcSecurity {
}
