package com.hospital.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtTokenService jwtTokenService;
    private final HospitalPublicEndpointMatcher publicEndpointMatcher;
    private final SecurityAuditService securityAuditService;

    @Value("${app.security.enabled:true}")
    private boolean securityEnabled;

    public JwtAuthenticationFilter(
            JwtTokenService jwtTokenService,
            HospitalPublicEndpointMatcher publicEndpointMatcher,
            SecurityAuditService securityAuditService) {
        this.jwtTokenService = jwtTokenService;
        this.publicEndpointMatcher = publicEndpointMatcher;
        this.securityAuditService = securityAuditService;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {
        if (!securityEnabled || publicEndpointMatcher.matches(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header == null || !header.startsWith(BEARER_PREFIX)) {
            filterChain.doFilter(request, response);
            return;
        }

        String raw = header.substring(BEARER_PREFIX.length()).trim();
        if (raw.isEmpty()) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            Claims claims = jwtTokenService.parseAndValidate(raw);
            String username = claims.getSubject();
            Long userId = claims.get("uid", Long.class);
            @SuppressWarnings("unchecked")
            List<String> roleStrings = claims.get("roles", List.class);
            List<SimpleGrantedAuthority> authorities = new ArrayList<>();
            if (roleStrings != null) {
                for (String r : roleStrings) {
                    if (r != null && !r.isBlank()) {
                        authorities.add(new SimpleGrantedAuthority(r));
                    }
                }
            }
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(username, null, authorities);
            authentication.setDetails(new JwtAuthenticationDetails(userId, username));
            SecurityContextHolder.getContext().setAuthentication(authentication);
        } catch (JwtException | IllegalArgumentException e) {
            SecurityContextHolder.clearContext();
            request.setAttribute(SecurityRequestAttributes.AUTH_FAILURE, SecurityRequestAttributes.FAILURE_JWT_INVALID);
            securityAuditService.recordJwtInvalid(request, request.getRequestURI(), e.getClass().getSimpleName());
        }

        filterChain.doFilter(request, response);
    }
}
