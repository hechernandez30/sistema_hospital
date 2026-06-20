package com.hospital.security.config;

import com.hospital.security.HospitalPublicEndpointMatcher;
import com.hospital.security.JwtAuthenticationFilter;
import com.hospital.security.RestAccessDeniedHandler;
import com.hospital.security.RestAuthenticationEntryPoint;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableConfigurationProperties({CorsProperties.class, JwtProperties.class})
public class SecurityConfig {

    private final RestAuthenticationEntryPoint authenticationEntryPoint;
    private final RestAccessDeniedHandler accessDeniedHandler;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final HospitalPublicEndpointMatcher publicEndpointMatcher;

    public SecurityConfig(
            RestAuthenticationEntryPoint authenticationEntryPoint,
            RestAccessDeniedHandler accessDeniedHandler,
            JwtAuthenticationFilter jwtAuthenticationFilter,
            HospitalPublicEndpointMatcher publicEndpointMatcher) {
        this.authenticationEntryPoint = authenticationEntryPoint;
        this.accessDeniedHandler = accessDeniedHandler;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.publicEndpointMatcher = publicEndpointMatcher;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            @Value("${app.security.enabled:true}") boolean securityEnabled,
            CorsConfigurationSource corsConfigurationSource) throws Exception {
        http.cors(cors -> cors.configurationSource(corsConfigurationSource));
        http.csrf(csrf -> csrf.disable());
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        http.sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        if (!securityEnabled) {
            http.authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
            return http.build();
        }

        http.authorizeHttpRequests(auth -> {
            auth.requestMatchers(publicEndpointMatcher).permitAll();

            auth.requestMatchers("/api/users/**").hasRole("ADMINISTRADOR");
            auth.requestMatchers("/api/roles/**").hasRole("ADMINISTRADOR");
            auth.requestMatchers("/api/audit-logs/**").hasAnyRole("ADMINISTRADOR", "AUDITOR");
            auth.requestMatchers("/api/reports/doctors/**").hasAnyRole("ADMINISTRADOR", "AUDITOR", "MEDICO-JEFE");
            auth.requestMatchers("/api/reports/**").hasAnyRole("ADMINISTRADOR", "AUDITOR");

            auth.requestMatchers("/api/payments/**").hasAnyRole("ADMINISTRADOR", "CAJERO");
            auth.requestMatchers(HttpMethod.GET, "/api/medications/**")
                    .hasAnyRole("ADMINISTRADOR", "FARMACIA", "MEDICO", "MEDICO-JEFE");
            auth.requestMatchers("/api/medications/**").hasAnyRole("ADMINISTRADOR", "FARMACIA");
            auth.requestMatchers("/api/laboratory/**").hasAnyRole("ADMINISTRADOR", "LABORATORIO", "MEDICO", "MEDICO-JEFE");
            auth.requestMatchers("/api/imaging/**").hasAnyRole("ADMINISTRADOR", "MEDICO", "MEDICO-JEFE");
            auth.requestMatchers(HttpMethod.GET, "/api/medical-orders/**")
                    .hasAnyRole("ADMINISTRADOR", "MEDICO", "MEDICO-JEFE", "FARMACIA", "LABORATORIO", "CAJERO");
            auth.requestMatchers("/api/medical-orders/**").hasAnyRole("ADMINISTRADOR", "MEDICO", "MEDICO-JEFE", "FARMACIA");
            auth.requestMatchers(HttpMethod.GET, "/api/medical-cares/**")
                    .hasAnyRole("ADMINISTRADOR", "MEDICO", "MEDICO-JEFE", "CAJERO", "LABORATORIO", "FARMACIA");
            auth.requestMatchers("/api/medical-cares/**").hasAnyRole("ADMINISTRADOR", "MEDICO", "MEDICO-JEFE");
            auth.requestMatchers("/api/appointments/**").hasAnyRole("ADMINISTRADOR", "MEDICO", "MEDICO-JEFE", "RECEPCIONISTA");
            auth.requestMatchers(HttpMethod.GET, "/api/admissions/**")
                    .hasAnyRole("ADMINISTRADOR", "RECEPCIONISTA", "MEDICO", "MEDICO-JEFE", "CAJERO");
            auth.requestMatchers("/api/admissions/**").hasAnyRole("ADMINISTRADOR", "RECEPCIONISTA");
            auth.requestMatchers("/api/triage/**").hasAnyRole("ADMINISTRADOR", "RECEPCIONISTA");
            auth.requestMatchers(HttpMethod.GET, "/api/staff/**")
                    .hasAnyRole("ADMINISTRADOR", "RRHH", "RECEPCIONISTA", "MEDICO", "MEDICO-JEFE");
            auth.requestMatchers("/api/staff/**").hasAnyRole("ADMINISTRADOR", "RRHH");
            auth.requestMatchers(HttpMethod.GET, "/api/specialties/**")
                    .hasAnyRole("ADMINISTRADOR", "RRHH", "RECEPCIONISTA", "MEDICO", "MEDICO-JEFE");
            auth.requestMatchers("/api/specialties/**").hasAnyRole("ADMINISTRADOR", "RRHH");

            auth.requestMatchers(HttpMethod.GET, "/api/patients/**")
                    .hasAnyRole("ADMINISTRADOR", "MEDICO", "MEDICO-JEFE", "RECEPCIONISTA", "CAJERO", "LABORATORIO", "FARMACIA");
            auth.requestMatchers("/api/patients/**")
                    .hasAnyRole("ADMINISTRADOR", "MEDICO", "RECEPCIONISTA");

            auth.requestMatchers("/api/**").hasRole("ADMINISTRADOR");
            auth.anyRequest().authenticated();
        });
        http.exceptionHandling(ex -> ex
                .authenticationEntryPoint(authenticationEntryPoint)
                .accessDeniedHandler(accessDeniedHandler));
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(CorsProperties corsProperties) {
        return request -> {
            List<String> origins = corsProperties.getAllowedOrigins();
            if (origins == null || origins.isEmpty()) {
                return null;
            }
            CorsConfiguration configuration = new CorsConfiguration();
            for (String origin : origins) {
                if (origin != null && !origin.isBlank()) {
                    configuration.addAllowedOriginPattern(origin.trim());
                }
            }
            if (configuration.getAllowedOriginPatterns() == null
                    || configuration.getAllowedOriginPatterns().isEmpty()) {
                return null;
            }
            configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
            configuration.setAllowedHeaders(List.of("*"));
            configuration.setExposedHeaders(List.of(HttpHeaders.AUTHORIZATION));
            configuration.setAllowCredentials(true);
            configuration.setMaxAge(3600L);
            return configuration;
        };
    }
}
