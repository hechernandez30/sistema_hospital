package com.hospital.auth.controller;

import com.hospital.auth.dto.LoginRequest;
import com.hospital.auth.dto.LoginResponse;
import com.hospital.security.HospitalUserDetails;
import com.hospital.security.JwtTokenService;
import com.hospital.security.SecurityAuditService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenService jwtTokenService;
    private final SecurityAuditService securityAuditService;

    public AuthController(
            AuthenticationManager authenticationManager,
            JwtTokenService jwtTokenService,
            SecurityAuditService securityAuditService) {
        this.authenticationManager = authenticationManager;
        this.jwtTokenService = jwtTokenService;
        this.securityAuditService = securityAuditService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        UsernamePasswordAuthenticationToken token =
                new UsernamePasswordAuthenticationToken(request.username().trim(), request.password());
        try {
            Authentication authentication = authenticationManager.authenticate(token);
            HospitalUserDetails principal = (HospitalUserDetails) authentication.getPrincipal();
            List<String> roles = principal.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .toList();
            String accessToken = jwtTokenService.createAccessToken(authentication, principal.getUser().getId());
            securityAuditService.recordLoginSuccess(
                    principal.getUser().getId(),
                    principal.getUser().getUsername(),
                    httpRequest);
            return ResponseEntity.ok(new LoginResponse(
                    principal.getUser().getId(),
                    principal.getUser().getUsername(),
                    roles,
                    accessToken));
        } catch (AuthenticationException ex) {
            securityAuditService.recordLoginFailure(request.username().trim(), httpRequest);
            throw ex;
        }
    }
}
