package com.hospital.staff.service;

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

import java.util.List;

@Service
public class StaffService {

    private final StaffRepository staffRepository;
    private final UserRepository userRepository;
    private final SpecialtyRepository specialtyRepository;

    public StaffService(
            StaffRepository staffRepository,
            UserRepository userRepository,
            SpecialtyRepository specialtyRepository) {
        this.staffRepository = staffRepository;
        this.userRepository = userRepository;
        this.specialtyRepository = specialtyRepository;
    }

    @Transactional(readOnly = true)
    public List<StaffResponse> findAll() {
        return staffRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public StaffResponse findById(Long id) {
        return toResponse(staffRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found: " + id)));
    }

    @Transactional
    public StaffResponse create(StaffCreateRequest request) {
        String code = request.employeeCode().trim();
        if (staffRepository.existsByEmployeeCode(code)) {
            throw new BusinessRuleException("Employee code already exists");
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
        return toResponse(staffRepository.save(staff));
    }

    @Transactional
    public StaffResponse update(Long id, StaffUpdateRequest request) {
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found: " + id));
        String code = request.employeeCode().trim();
        if (!code.equals(staff.getEmployeeCode()) && staffRepository.existsByEmployeeCode(code)) {
            throw new BusinessRuleException("Employee code already exists");
        }
        staff.setStaffType(request.staffType());
        staff.setEmployeeCode(code);
        staff.setLicenseNumber(request.licenseNumber());
        staff.setSchedule(request.schedule());
        staff.setAttendance(request.attendance() != null ? request.attendance() : "PRESENTE");
        staff.setActive(request.active());
        staff.setHireDate(request.hireDate());
        attachUser(staff, request.userId(), id);
        attachSpecialty(staff, request.specialtyId());
        return toResponse(staffRepository.save(staff));
    }

    @Transactional
    public void delete(Long id) {
        if (!staffRepository.existsById(id)) {
            throw new ResourceNotFoundException("Staff not found: " + id);
        }
        staffRepository.deleteById(id);
    }

    private void attachUser(Staff staff, Long userId, Long currentStaffId) {
        if (userId == null) {
            staff.setUser(null);
            return;
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        staffRepository.findByUser_Id(userId).ifPresent(other -> {
            if (currentStaffId == null || !other.getId().equals(currentStaffId)) {
                throw new BusinessRuleException("User is already linked to another staff record");
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
                .orElseThrow(() -> new ResourceNotFoundException("Specialty not found: " + specialtyId));
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
}
