package com.hospital.role.service;

import com.hospital.auditlog.BusinessAuditActions;
import com.hospital.auditlog.BusinessAuditRecorder;
import com.hospital.exception.ResourceNotFoundException;
import com.hospital.role.dto.RoleRequest;
import com.hospital.role.dto.RoleResponse;
import com.hospital.role.entity.Role;
import com.hospital.role.repository.RoleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class RoleService {

    private final RoleRepository roleRepository;
    private final BusinessAuditRecorder businessAuditRecorder;

    public RoleService(RoleRepository roleRepository, BusinessAuditRecorder businessAuditRecorder) {
        this.roleRepository = roleRepository;
        this.businessAuditRecorder = businessAuditRecorder;
    }

    @Transactional(readOnly = true)
    public List<RoleResponse> findAll() {
        return roleRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public RoleResponse findById(Long id) {
        return toResponse(roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el rol: " + id)));
    }

    @Transactional
    public RoleResponse create(RoleRequest request) {
        Role role = new Role();
        role.setName(request.name().trim());
        role.setDescription(request.description());
        Role saved = roleRepository.save(role);
        businessAuditRecorder.safeRecord(
                "roles",
                "Role",
                String.valueOf(saved.getId()),
                BusinessAuditActions.CREATE,
                null,
                snapshotRoleMinimal(saved));
        return toResponse(saved);
    }

    @Transactional
    public RoleResponse update(Long id, RoleRequest request) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el rol: " + id));
        Map<String, Object> prior = snapshotRoleMinimal(role);
        role.setName(request.name().trim());
        role.setDescription(request.description());
        Role saved = roleRepository.save(role);
        businessAuditRecorder.safeRecord(
                "roles",
                "Role",
                String.valueOf(id),
                BusinessAuditActions.UPDATE,
                prior,
                snapshotRoleMinimal(saved));
        return toResponse(saved);
    }

    @Transactional
    public void delete(Long id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el rol: " + id));
        Map<String, Object> prior = snapshotRoleMinimal(role);
        roleRepository.deleteById(id);
        businessAuditRecorder.safeRecord("roles", "Role", String.valueOf(id), BusinessAuditActions.DELETE, prior, null);
    }

    private RoleResponse toResponse(Role role) {
        return new RoleResponse(role.getId(), role.getName(), role.getDescription());
    }

    private static Map<String, Object> snapshotRoleMinimal(Role r) {
        Map<String, Object> m = new LinkedHashMap<>();
        if (r.getId() != null) {
            m.put("roleId", r.getId());
        }
        m.put("name", r.getName());
        return m;
    }
}
