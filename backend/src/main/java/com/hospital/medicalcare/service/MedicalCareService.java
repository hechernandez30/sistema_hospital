package com.hospital.medicalcare.service;

import com.hospital.admission.entity.Admission;
import com.hospital.admission.repository.AdmissionRepository;
import com.hospital.appointment.entity.Appointment;
import com.hospital.appointment.repository.AppointmentRepository;
import com.hospital.auditlog.BusinessAuditActions;
import com.hospital.auditlog.BusinessAuditRecorder;
import com.hospital.exception.BusinessRuleException;
import com.hospital.exception.ResourceNotFoundException;
import com.hospital.medicalcare.dto.MedicalCareCreateRequest;
import com.hospital.medicalcare.dto.MedicalCareResponse;
import com.hospital.medicalcare.dto.MedicalCareUpdateRequest;
import com.hospital.medicalcare.entity.MedicalCare;
import com.hospital.medicalcare.repository.MedicalCareRepository;
import com.hospital.patient.entity.Patient;
import com.hospital.patient.repository.PatientRepository;
import com.hospital.staff.entity.Staff;
import com.hospital.staff.repository.StaffRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class MedicalCareService {

    /** Cita “activa” para vincular atención (alineado a estados de cita en el dominio). */
    private static final Set<String> ACTIVE_APPOINTMENT_STATUS = Set.of("PROGRAMADA", "REPROGRAMADA");

    private final MedicalCareRepository medicalCareRepository;
    private final PatientRepository patientRepository;
    private final AdmissionRepository admissionRepository;
    private final AppointmentRepository appointmentRepository;
    private final StaffRepository staffRepository;
    private final BusinessAuditRecorder businessAuditRecorder;

    public MedicalCareService(
            MedicalCareRepository medicalCareRepository,
            PatientRepository patientRepository,
            AdmissionRepository admissionRepository,
            AppointmentRepository appointmentRepository,
            StaffRepository staffRepository,
            BusinessAuditRecorder businessAuditRecorder) {
        this.medicalCareRepository = medicalCareRepository;
        this.patientRepository = patientRepository;
        this.admissionRepository = admissionRepository;
        this.appointmentRepository = appointmentRepository;
        this.staffRepository = staffRepository;
        this.businessAuditRecorder = businessAuditRecorder;
    }

    @Transactional(readOnly = true)
    public List<MedicalCareResponse> findAll() {
        return medicalCareRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public MedicalCareResponse findById(Long id) {
        return toResponse(medicalCareRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró la atención médica: " + id)));
    }

    @Transactional(readOnly = true)
    public List<MedicalCareResponse> findByPatient(Long patientId) {
        return medicalCareRepository.findByPatient_Id(patientId).stream().map(this::toResponse).toList();
    }

    @Transactional
    public MedicalCareResponse create(MedicalCareCreateRequest request) {
        MedicalCare medicalCare = new MedicalCare();
        mapCommon(medicalCare, request.patientId(), request.admissionId(), request.appointmentId(), request.doctorId(),
                request.consultationReason(), request.clinicalEvaluation(), request.diagnosis(),
                request.treatmentPlan(), request.requiresHospitalization() != null && request.requiresHospitalization());
        MedicalCare saved = medicalCareRepository.save(medicalCare);
        businessAuditRecorder.safeRecord(
                "medical-care",
                "MedicalCare",
                String.valueOf(saved.getId()),
                BusinessAuditActions.CREATE,
                null,
                snapshotMedicalCareMinimal(saved));
        return toResponse(saved);
    }

    @Transactional
    public MedicalCareResponse update(Long id, MedicalCareUpdateRequest request) {
        MedicalCare medicalCare = medicalCareRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró la atención médica: " + id));
        Map<String, Object> prior = snapshotMedicalCareMinimal(medicalCare);
        mapCommon(medicalCare, request.patientId(), request.admissionId(), request.appointmentId(), request.doctorId(),
                request.consultationReason(), request.clinicalEvaluation(), request.diagnosis(),
                request.treatmentPlan(), request.requiresHospitalization());
        MedicalCare saved = medicalCareRepository.save(medicalCare);
        businessAuditRecorder.safeRecord(
                "medical-care",
                "MedicalCare",
                String.valueOf(id),
                BusinessAuditActions.UPDATE,
                prior,
                snapshotMedicalCareMinimal(saved));
        return toResponse(saved);
    }

    @Transactional
    public void delete(Long id) {
        MedicalCare medicalCare = medicalCareRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró la atención médica: " + id));
        Map<String, Object> prior = snapshotMedicalCareMinimal(medicalCare);
        medicalCareRepository.deleteById(id);
        businessAuditRecorder.safeRecord(
                "medical-care",
                "MedicalCare",
                String.valueOf(id),
                BusinessAuditActions.DELETE,
                prior,
                null);
    }

    private void mapCommon(
            MedicalCare medicalCare,
            Long patientId,
            Long admissionId,
            Long appointmentId,
            Long doctorId,
            String consultationReason,
            String clinicalEvaluation,
            String diagnosis,
            String treatmentPlan,
            boolean requiresHospitalization) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el paciente: " + patientId));
        Staff doctor = staffRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el personal: " + doctorId));
        Admission admission = resolveAdmission(admissionId);
        Appointment appointment = resolveAppointment(appointmentId);

        validateContextAdmissionOrAppointment(admission, appointment);
        validateOwnership(patient.getId(), admission, appointment);

        medicalCare.setPatient(patient);
        medicalCare.setAdmission(admission);
        medicalCare.setAppointment(appointment);
        medicalCare.setDoctor(doctor);
        medicalCare.setConsultationReason(consultationReason);
        medicalCare.setClinicalEvaluation(clinicalEvaluation);
        medicalCare.setDiagnosis(diagnosis);
        medicalCare.setTreatmentPlan(treatmentPlan);
        medicalCare.setRequiresHospitalization(requiresHospitalization);
    }

    private Admission resolveAdmission(Long admissionId) {
        if (admissionId == null) {
            return null;
        }
        return admissionRepository.findById(admissionId)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró la admisión: " + admissionId));
    }

    private Appointment resolveAppointment(Long appointmentId) {
        if (appointmentId == null) {
            return null;
        }
        return appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró la cita: " + appointmentId));
    }

    private void validateContextAdmissionOrAppointment(Admission admission, Appointment appointment) {
        boolean hasAdmission = admission != null;
        boolean hasAppointment = appointment != null;
        if (!hasAdmission && !hasAppointment) {
            throw new BusinessRuleException(
                    "La atención médica debe vincularse a una admisión existente (indique el ID de admisión del episodio). "
                            + "Opcionalmente puede vincular también una cita en estado PROGRAMADA o REPROGRAMADA.");
        }
        if (!hasAdmission) {
            throw new BusinessRuleException(
                    "Si asocia una cita programada debe indicar también la admisión del mismo paciente para ese episodio.");
        }
        if (hasAppointment && !isActiveAppointmentStatus(appointment.getStatus())) {
            throw new BusinessRuleException(
                    "La cita debe estar en estado PROGRAMADA o REPROGRAMADA para vincularla a esta atención médica.");
        }
    }

    private static boolean isActiveAppointmentStatus(String status) {
        if (status == null) {
            return false;
        }
        return ACTIVE_APPOINTMENT_STATUS.contains(status.trim().toUpperCase());
    }

    private Map<String, Object> snapshotMedicalCareMinimal(MedicalCare m) {
        Map<String, Object> map = new LinkedHashMap<>();
        if (m.getId() != null) {
            map.put("medicalCareId", m.getId());
        }
        map.put("patientId", m.getPatient().getId());
        if (m.getAdmission() != null && m.getAdmission().getId() != null) {
            map.put("admissionId", m.getAdmission().getId());
        }
        if (m.getAppointment() != null && m.getAppointment().getId() != null) {
            map.put("appointmentId", m.getAppointment().getId());
        }
        if (m.getDoctor() != null && m.getDoctor().getId() != null) {
            map.put("doctorId", m.getDoctor().getId());
        }
        if (m.getCareDate() != null) {
            map.put("careDate", m.getCareDate().toString());
        }
        return map;
    }

    private void validateOwnership(Long patientId, Admission admission, Appointment appointment) {
        if (admission != null && !admission.getPatient().getId().equals(patientId)) {
            throw new BusinessRuleException("La admisión no pertenece al paciente seleccionado");
        }
        if (appointment != null && !appointment.getPatient().getId().equals(patientId)) {
            throw new BusinessRuleException("La cita no pertenece al paciente seleccionado");
        }
    }

    private MedicalCareResponse toResponse(MedicalCare medicalCare) {
        return new MedicalCareResponse(
                medicalCare.getId(),
                medicalCare.getPatient().getId(),
                medicalCare.getAdmission() != null ? medicalCare.getAdmission().getId() : null,
                medicalCare.getAppointment() != null ? medicalCare.getAppointment().getId() : null,
                medicalCare.getDoctor().getId(),
                medicalCare.getConsultationReason(),
                medicalCare.getClinicalEvaluation(),
                medicalCare.getDiagnosis(),
                medicalCare.getTreatmentPlan(),
                medicalCare.isRequiresHospitalization(),
                medicalCare.getCareDate());
    }
}
