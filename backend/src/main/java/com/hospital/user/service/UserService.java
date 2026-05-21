package com.hospital.user.service;

import com.hospital.auditlog.BusinessAuditActions;
import com.hospital.auditlog.BusinessAuditRecorder;
import com.hospital.exception.BusinessRuleException;
import com.hospital.exception.ResourceNotFoundException;
import com.hospital.role.entity.Role;
import com.hospital.role.repository.RoleRepository;
import com.hospital.user.dto.UserCreateRequest;
import com.hospital.user.dto.UserResponse;
import com.hospital.user.dto.UserUpdateRequest;
import com.hospital.user.entity.User;
import com.hospital.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final BusinessAuditRecorder businessAuditRecorder;

    public UserService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            BusinessAuditRecorder businessAuditRecorder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.businessAuditRecorder = businessAuditRecorder;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> findAll() {
        return userRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public UserResponse findById(Long id) {
        return toResponse(userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el usuario: " + id)));
    }

    @Transactional
    public UserResponse create(UserCreateRequest request) {
        if (userRepository.existsByUsername(request.username().trim())) {
            throw new BusinessRuleException(
                    "Ese nombre de usuario ya está registrado. Elija otro distinto.");
        }
        if (userRepository.existsByEmail(request.email().trim())) {
            throw new BusinessRuleException(
                    "Ese correo electrónico ya está asociado a otro usuario. Use otro correo o recupere la cuenta existente.");
        }
        Role role = roleRepository.findById(request.roleId())
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el rol: " + request.roleId()));
        User user = new User();
        user.setRole(role);
        user.setUsername(request.username().trim());
        user.setEmail(request.email().trim());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        user.setMfaEnabled(request.mfaEnabled() != null && request.mfaEnabled());
        UserResponse created = toResponse(userRepository.save(user));
        businessAuditRecorder.safeRecord(
                "users",
                "User",
                String.valueOf(created.id()),
                BusinessAuditActions.CREATE,
                null,
                summaryUserAudit(created));
        return created;
    }

    @Transactional
    public UserResponse update(Long id, UserUpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el usuario: " + id));
        UserResponse prior = toResponse(user);
        String email = request.email().trim();
        if (!email.equalsIgnoreCase(user.getEmail()) && userRepository.existsByEmail(email)) {
            throw new BusinessRuleException(
                    "Ese correo electrónico ya está asociado a otro usuario. Use otro correo.");
        }
        Role role = roleRepository.findById(request.roleId())
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el rol: " + request.roleId()));
        user.setRole(role);
        user.setEmail(email);
        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        user.setState(request.state());
        if (request.password() != null && !request.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
        }
        UserResponse updated = toResponse(userRepository.save(user));
        Map<String, Object> neu = new LinkedHashMap<>(summaryUserAudit(updated));
        if (request.password() != null && !request.password().isBlank()) {
            neu.put("passwordRotated", Boolean.TRUE);
        }
        businessAuditRecorder.safeRecord(
                "users",
                "User",
                String.valueOf(id),
                BusinessAuditActions.UPDATE,
                summaryUserAudit(prior),
                neu);
        return updated;
    }

    @Transactional
    public void delete(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el usuario: " + id));
        if ("DESHABILITADO".equalsIgnoreCase(user.getState())) {
            return;
        }
        UserResponse prior = toResponse(user);
        user.setState("DESHABILITADO");
        UserResponse updated = toResponse(userRepository.save(user));
        businessAuditRecorder.safeRecord(
                "users",
                "User",
                String.valueOf(id),
                BusinessAuditActions.UPDATE,
                summaryUserAudit(prior),
                summaryUserAudit(updated));
    }

    /** Sin correo ni contraseña — solo datos mínimos para trazabilidad. */
    private static Map<String, Object> summaryUserAudit(UserResponse r) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("userId", r.id());
        row.put("username", r.username());
        row.put("roleId", r.roleId());
        row.put("state", r.state());
        return row;
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getRole().getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getState(),
                user.isMfaEnabled(),
                user.getCreatedAt(),
                user.getUpdatedAt());
    }
}
