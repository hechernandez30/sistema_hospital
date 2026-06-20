package com.hospital.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.http.HttpMethod;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.security.web.util.matcher.OrRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Única fuente de verdad para rutas públicas (JWT + {@code SecurityConfig}).
 */
@Component
public class HospitalPublicEndpointMatcher implements RequestMatcher {

    private final RequestMatcher delegate;

    public HospitalPublicEndpointMatcher(Environment environment) {
        List<RequestMatcher> matchers = new ArrayList<>();
        matchers.add(new AntPathRequestMatcher("/**", HttpMethod.OPTIONS.name()));
        matchers.add(new AntPathRequestMatcher("/error"));
        matchers.add(new AntPathRequestMatcher("/actuator/health", HttpMethod.GET.name()));
        matchers.add(new AntPathRequestMatcher("/actuator/health/**", HttpMethod.GET.name()));
        matchers.add(new AntPathRequestMatcher("/api/auth/login", HttpMethod.POST.name()));
        if (environment.acceptsProfiles(Profiles.of("dev"))) {
            matchers.add(new AntPathRequestMatcher("/swagger-ui.html"));
            matchers.add(new AntPathRequestMatcher("/swagger-ui/**"));
            matchers.add(new AntPathRequestMatcher("/v3/api-docs"));
            matchers.add(new AntPathRequestMatcher("/v3/api-docs/**"));
        }
        this.delegate = new OrRequestMatcher(matchers);
    }

    @Override
    public boolean matches(HttpServletRequest request) {
        return delegate.matches(request);
    }
}
