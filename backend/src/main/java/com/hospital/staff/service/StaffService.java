package com.hospital.staff.service;

import com.hospital.auditlog.BusinessAuditActions;
import com.hospital.auditlog.BusinessAuditRecorder;
import com.hospital.exception.BusinessRuleException;
import com.hospital.exception.ResourceNotFoundException;
import com.hospital.specialty.entity.Specialty;
import com.hospital.specialty.repository.SpecialtyRepository;
import com.hospital.staff.dto.StaffCreateRequest;
import com.hospital.staff.dto.StaffResponse;
import com.hospital.staff.dto.StaffUpdateRequest;
import com.hospital.staff.entity.Staff;
import com.hospital.staff.repository.StaffRepository;
import com.hospital.user.entity.User;
import com.hospital.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class StaffService {

    private final StaffRepository staffRepository;
    private final UserRepository userRepository;
    private final SpecialtyRepository specialtyRepository;
    private final BusinessAuditRecorder businessAuditRecorder;

    public StaffService(
            StaffRepository staffRepository,
            UserRepository userRepository,
            SpecialtyRepository specialtyRepository,
            BusinessAuditRecorder businessAuditRecorder) {
        this.staffRepository = staffRepository;
        this.userRepository = userRepository;
        this.specialtyRepository = specialtyRepository;
        this.businessAuditRecorder = businessAuditRecorder;
    }

    @Transactional(readOnly = true)
    public List<StaffResponse> findAll(boolean includeInactive) {
        var rows = includeInactive ? staffRepository.findAll() : staffRepository.findByActiveTrue();
        return rows.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public StaffResponse findById(Long id) {
        return toResponse(staffRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el personal: " + id)));
    }

    @Transactional
    public StaffResponse create(StaffCreateRequest request) {
        String code = request.employeeCode().trim();
        if (staffRepository.existsByEmployeeCode(code)) {
            throw new BusinessRuleException(
                    "El código de empleado ya está en uso. Elija otro o revise el registro existente.");
        }
        Staff staff = new Staff();
        staff.setStaffType(request.staffType());
        staff.setEmployeeCode(code);
        staff.setLicenseNumber(request.licenseNumber());
        staff.setSchedule(request.schedule());
        staff.setAttendance(request.attendance() != null ? request.attendance() : "PRESENTE");
        staff.setActive(request.active() == null || request.active());
        staff.setHireDate(request.hireDate());
        attachUser(staff, request.userId(), null);
        attachSpecialty(staff, request.specialtyId());
        Staff saved = staffRepository.save(staff);
        businessAuditRecorder.safeRecord(
                "staff",
                "Staff",
                String.valueOf(saved.getId()),
                BusinessAuditActions.CREATE,
                null,
                snapshotStaffMinimal(saved));
        return toResponse(saved);
    }

    @Transactional
    public StaffResponse update(Long id, StaffUpdateRequest request) {
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el personal: " + id));
        String code = request.employeeCode().trim();
        if (!code.equals(staff.getEmployeeCode()) && staffRepository.existsByEmployeeCode(code)) {
            throw new BusinessRuleException(
                    "El código de empleado ya está en uso. Elija otro o revise el registro existente.");
        }
        Map<String, Object> prior = snapshotStaffMinimal(staff);
        staff.setStaffType(request.staffType());
        staff.setEmployeeCode(code);
        staff.setLicenseNumber(request.licenseNumber());
        staff.setSchedule(request.schedule());
        staff.setAttendance(request.attendance() != null ? request.attendance() : "PRESENTE");
        staff.setActive(request.active());
        staff.setHireDate(request.hireDate());
        attachUser(staff, request.userId(), id);
        attachSpecialty(staff, request.specialtyId());
        Staff saved = staffRepository.save(staff);
        businessAuditRecorder.safeRecord(
                "staff",
                "Staff",
                String.valueOf(id),
                BusinessAuditActions.UPDATE,
                prior,
                snapshotStaffMinimal(saved));
        return toResponse(saved);
    }

    @Transactional
    public void delete(Long id) {
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el personal: " + id));
        if (!staff.isActive()) {
            return;
        }
        Map<String, Object> prior = snapshotStaffMinimal(staff);
        staff.setActive(false);
        Staff saved = staffRepository.save(staff);
        businessAuditRecorder.safeRecord(
                "staff",
                "Staff",
                String.valueOf(id),
                BusinessAuditActions.UPDATE,
                prior,
                snapshotStaffMinimal(saved));
    }

    private void attachUser(Staff staff, Long userId, Long currentStaffId) {
        if (userId == null) {
            staff.setUser(null);
            return;
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el usuario: " + userId));
        staffRepository.findByUser_Id(userId).ifPresent(other -> {
            if (currentStaffId == null || !other.getId().equals(currentStaffId)) {
                throw new BusinessRuleException("El usuario ya está vinculado a otro registro de personal");
            }
        });
        staff.setUser(user);
    }

    private void attachSpecialty(Staff staff, Long specialtyId) {
        if (specialtyId == null) {
            staff.setSpecialty(null);
            return;
        }
        Specialty specialty = specialtyRepository.findById(specialtyId)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró la especialidad: " + specialtyId));
        staff.setSpecialty(specialty);
    }

    private StaffResponse toResponse(Staff staff) {
        return new StaffResponse(
                staff.getId(),
                staff.getUser() != null ? staff.getUser().getId() : null,
                staff.getSpecialty() != null ? staff.getSpecialty().getId() : null,
                staff.getStaffType(),
                staff.getEmployeeCode(),
                staff.getLicenseNumber(),
                staff.getSchedule(),
                staff.getAttendance(),
                staff.isActive(),
                staff.getHireDate());
    }

    private static Map<String, Object> snapshotStaffMinimal(Staff s) {
        Map<String, Object> m = new LinkedHashMap<>();
        if (s.getId() != null) {
            m.put("staffId", s.getId());
        }
        m.put("employeeCode", s.getEmployeeCode());
        m.put("staffType", s.getStaffType());
        m.put("attendance", s.getAttendance());
        m.put("active", s.isActive());
        if (s.getUser() != null) {
            m.put("userId", s.getUser().getId());
        }
        if (s.getSpecialty() != null) {
            m.put("specialtyId", s.getSpecialty().getId());
        }
        return m;
    }
}
