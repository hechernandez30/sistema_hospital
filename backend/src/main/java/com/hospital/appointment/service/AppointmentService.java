package com.hospital.appointment.service;

import com.hospital.appointment.dto.AppointmentCreateRequest;
import com.hospital.appointment.dto.AppointmentResponse;
import com.hospital.appointment.dto.AppointmentUpdateRequest;
import com.hospital.appointment.entity.Appointment;
import com.hospital.appointment.repository.AppointmentRepository;
import com.hospital.auditlog.BusinessAuditActions;
import com.hospital.auditlog.BusinessAuditRecorder;
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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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
    private final BusinessAuditRecorder businessAuditRecorder;

    public AppointmentService(
            AppointmentRepository appointmentRepository,
            PatientRepository patientRepository,
            StaffRepository staffRepository,
            SpecialtyRepository specialtyRepository,
            UserRepository userRepository,
            BusinessAuditRecorder businessAuditRecorder) {
        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
        this.staffRepository = staffRepository;
        this.specialtyRepository = specialtyRepository;
        this.userRepository = userRepository;
        this.businessAuditRecorder = businessAuditRecorder;
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> findAll() {
        return appointmentRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public AppointmentResponse findById(Long id) {
        return toResponse(appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró la cita: " + id)));
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

        validateDoctorActiveIntervalOverlap(
                appointment.getDoctor().getId(),
                appointment.getStartAt(),
                appointment.getEndAt(),
                appointment.getStatus(),
                null);
        Appointment saved = appointmentRepository.save(appointment);
        businessAuditRecorder.safeRecord(
                "appointments",
                "Appointment",
                String.valueOf(saved.getId()),
                BusinessAuditActions.CREATE,
                null,
                snapshotAppointmentMinimal(saved));
        return toResponse(saved);
    }

    @Transactional
    public AppointmentResponse update(Long id, AppointmentUpdateRequest request) {
        validateStatus(request.status());
        validateDateRange(request.startAt(), request.endAt());

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró la cita: " + id));
        Map<String, Object> prior = snapshotAppointmentMinimal(appointment);

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

        validateDoctorActiveIntervalOverlap(
                appointment.getDoctor().getId(),
                appointment.getStartAt(),
                appointment.getEndAt(),
                appointment.getStatus(),
                appointment.getId());

        Appointment saved = appointmentRepository.save(appointment);
        businessAuditRecorder.safeRecord(
                "appointments",
                "Appointment",
                String.valueOf(id),
                BusinessAuditActions.UPDATE,
                prior,
                snapshotAppointmentMinimal(saved));
        return toResponse(saved);
    }

    @Transactional
    public void delete(Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró la cita: " + id));
        if ("CANCELADA".equalsIgnoreCase(appointment.getStatus())) {
            return;
        }
        Map<String, Object> prior = snapshotAppointmentMinimal(appointment);
        appointment.setStatus("CANCELADA");
        Appointment saved = appointmentRepository.save(appointment);
        businessAuditRecorder.safeRecord(
                "appointments",
                "Appointment",
                String.valueOf(id),
                BusinessAuditActions.UPDATE,
                prior,
                snapshotAppointmentMinimal(saved));
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
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el paciente: " + patientId));
        Staff doctor = staffRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el personal: " + doctorId));

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
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró la especialidad: " + specialtyId));
    }

    private User resolveUser(Long userId) {
        if (userId == null) {
            return null;
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el usuario: " + userId));
    }

    private void validateStatus(String status) {
        if (!ALLOWED_STATUS.contains(status)) {
            throw new BusinessRuleException("Estado de cita no válido");
        }
    }

    private void validateDateRange(LocalDateTime startAt, LocalDateTime endAt) {
        if (!endAt.isAfter(startAt)) {
            throw new BusinessRuleException(
                    "La fecha y hora de fin debe ser posterior a la de inicio (no pueden ser iguales).");
        }
    }

    /** Citas PROGRAMADA/REPROGRAMADA no pueden solaparse en el tiempo para el mismo médico. */
    private void validateDoctorActiveIntervalOverlap(
            Long doctorId, LocalDateTime startAt, LocalDateTime endAt, String status, Long excludeAppointmentId) {
        if (!ACTIVE_STATUS.contains(status)) {
            return;
        }
        long hits = appointmentRepository.countActiveOverlapInterval(
                doctorId, startAt, endAt, ACTIVE_STATUS, excludeAppointmentId);
        if (hits > 0) {
            throw new BusinessRuleException(
                    "Este médico ya tiene otra cita activa que se traslapa con el horario elegido "
                            + "(PROGRAMADA o REPROGRAMADA). Ajuste las horas o el médico.");
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

    private static Map<String, Object> snapshotAppointmentMinimal(Appointment a) {
        Map<String, Object> m = new LinkedHashMap<>();
        if (a.getId() != null) {
            m.put("appointmentId", a.getId());
        }
        m.put("patientId", a.getPatient().getId());
        m.put("doctorId", a.getDoctor().getId());
        m.put("startAt", a.getStartAt() != null ? a.getStartAt().toString() : null);
        m.put("endAt", a.getEndAt() != null ? a.getEndAt().toString() : null);
        m.put("status", a.getStatus());
        return m;
    }
}
