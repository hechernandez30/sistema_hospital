package com.hospital.appointment.service;

import com.hospital.appointment.dto.AppointmentCreateRequest;
import com.hospital.appointment.dto.AppointmentResponse;
import com.hospital.appointment.dto.AppointmentUpdateRequest;
import com.hospital.appointment.entity.Appointment;
import com.hospital.appointment.repository.AppointmentRepository;
import com.hospital.exception.BusinessRuleException;
import com.hospital.exception.ResourceNotFoundException;
import com.hospital.patient.entity.Patient;
import com.hospital.patient.repository.PatientRepository;
import com.hospital.specialty.entity.Specialty;
import com.hospital.specialty.repository.SpecialtyRepository;
import com.hospital.staff.entity.Staff;
import com.hospital.staff.repository.StaffRepository;
import com.hospital.user.entity.User;
import com.hospital.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
public class AppointmentService {

    private static final Set<String> ALLOWED_STATUS = Set.of("PROGRAMADA", "REPROGRAMADA", "CANCELADA", "ATENDIDA", "NO_ASISTIO");
    private static final Set<String> ACTIVE_STATUS = Set.of("PROGRAMADA", "REPROGRAMADA");

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final StaffRepository staffRepository;
    private final SpecialtyRepository specialtyRepository;
    private final UserRepository userRepository;

    public AppointmentService(
            AppointmentRepository appointmentRepository,
            PatientRepository patientRepository,
            StaffRepository staffRepository,
            SpecialtyRepository specialtyRepository,
            UserRepository userRepository) {
        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
        this.staffRepository = staffRepository;
        this.specialtyRepository = specialtyRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> findAll() {
        return appointmentRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public AppointmentResponse findById(Long id) {
        return toResponse(appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + id)));
    }

    @Transactional
    public AppointmentResponse create(AppointmentCreateRequest request) {
        validateStatus(request.status());
        validateDateRange(request.startAt(), request.endAt());

        Appointment appointment = new Appointment();
        mapCommon(
                appointment,
                request.patientId(),
                request.doctorId(),
                request.specialtyId(),
                request.startAt(),
                request.endAt(),
                request.reason(),
                request.status(),
                request.notifyEmail() != null && request.notifyEmail(),
                request.notifySms() != null && request.notifySms(),
                request.notifyWhatsapp() != null && request.notifyWhatsapp(),
                request.createdByUserId());

        validateDoctorSchedule(appointment.getDoctor().getId(), appointment.getStartAt(), appointment.getStatus(), null);
        return toResponse(appointmentRepository.save(appointment));
    }

    @Transactional
    public AppointmentResponse update(Long id, AppointmentUpdateRequest request) {
        validateStatus(request.status());
        validateDateRange(request.startAt(), request.endAt());

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + id));

        mapCommon(
                appointment,
                request.patientId(),
                request.doctorId(),
                request.specialtyId(),
                request.startAt(),
                request.endAt(),
                request.reason(),
                request.status(),
                request.notifyEmail(),
                request.notifySms(),
                request.notifyWhatsapp(),
                request.createdByUserId());

        validateDoctorSchedule(appointment.getDoctor().getId(), appointment.getStartAt(), appointment.getStatus(), appointment.getId());
        return toResponse(appointmentRepository.save(appointment));
    }

    @Transactional
    public void delete(Long id) {
        if (!appointmentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Appointment not found: " + id);
        }
        appointmentRepository.deleteById(id);
    }

    private void mapCommon(
            Appointment appointment,
            Long patientId,
            Long doctorId,
            Long specialtyId,
            LocalDateTime startAt,
            LocalDateTime endAt,
            String reason,
            String status,
            boolean notifyEmail,
            boolean notifySms,
            boolean notifyWhatsapp,
            Long createdByUserId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + patientId));
        Staff doctor = staffRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found: " + doctorId));

        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setSpecialty(resolveSpecialty(specialtyId));
        appointment.setStartAt(startAt);
        appointment.setEndAt(endAt);
        appointment.setReason(reason);
        appointment.setStatus(status);
        appointment.setNotifyEmail(notifyEmail);
        appointment.setNotifySms(notifySms);
        appointment.setNotifyWhatsapp(notifyWhatsapp);
        appointment.setCreatedBy(resolveUser(createdByUserId));
    }

    private Specialty resolveSpecialty(Long specialtyId) {
        if (specialtyId == null) {
            return null;
        }
        return specialtyRepository.findById(specialtyId)
                .orElseThrow(() -> new ResourceNotFoundException("Specialty not found: " + specialtyId));
    }

    private User resolveUser(Long userId) {
        if (userId == null) {
            return null;
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
    }

    private void validateStatus(String status) {
        if (!ALLOWED_STATUS.contains(status)) {
            throw new BusinessRuleException("Invalid appointment status");
        }
    }

    private void validateDateRange(LocalDateTime startAt, LocalDateTime endAt) {
        if (!endAt.isAfter(startAt)) {
            throw new BusinessRuleException("Appointment endAt must be after startAt");
        }
    }

    private void validateDoctorSchedule(Long doctorId, LocalDateTime startAt, String status, Long currentAppointmentId) {
        if (!ACTIVE_STATUS.contains(status)) {
            return;
        }
        boolean conflict = appointmentRepository.existsByDoctor_IdAndStartAtAndStatusIn(doctorId, startAt, ACTIVE_STATUS);
        if (!conflict) {
            return;
        }
        if (currentAppointmentId == null) {
            throw new BusinessRuleException("Doctor already has an active appointment at this start time");
        }
        Appointment current = appointmentRepository.findById(currentAppointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + currentAppointmentId));
        if (!current.getDoctor().getId().equals(doctorId) || !current.getStartAt().equals(startAt) || !ACTIVE_STATUS.contains(current.getStatus())) {
            throw new BusinessRuleException("Doctor already has an active appointment at this start time");
        }
    }

    private AppointmentResponse toResponse(Appointment a) {
        return new AppointmentResponse(
                a.getId(),
                a.getPatient().getId(),
                a.getDoctor().getId(),
                a.getSpecialty() != null ? a.getSpecialty().getId() : null,
                a.getStartAt(),
                a.getEndAt(),
                a.getReason(),
                a.getStatus(),
                a.isNotifyEmail(),
                a.isNotifySms(),
                a.isNotifyWhatsapp(),
                a.getCreatedBy() != null ? a.getCreatedBy().getId() : null,
                a.getCreatedAt(),
                a.getUpdatedAt());
    }
}
