package com.hospital.medicalcare.service;

import com.hospital.admission.entity.Admission;
import com.hospital.admission.repository.AdmissionRepository;
import com.hospital.appointment.entity.Appointment;
import com.hospital.appointment.repository.AppointmentRepository;
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

import java.util.List;

@Service
public class MedicalCareService {

    private final MedicalCareRepository medicalCareRepository;
    private final PatientRepository patientRepository;
    private final AdmissionRepository admissionRepository;
    private final AppointmentRepository appointmentRepository;
    private final StaffRepository staffRepository;

    public MedicalCareService(
            MedicalCareRepository medicalCareRepository,
            PatientRepository patientRepository,
            AdmissionRepository admissionRepository,
            AppointmentRepository appointmentRepository,
            StaffRepository staffRepository) {
        this.medicalCareRepository = medicalCareRepository;
        this.patientRepository = patientRepository;
        this.admissionRepository = admissionRepository;
        this.appointmentRepository = appointmentRepository;
        this.staffRepository = staffRepository;
    }

    @Transactional(readOnly = true)
    public List<MedicalCareResponse> findAll() {
        return medicalCareRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public MedicalCareResponse findById(Long id) {
        return toResponse(medicalCareRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medical care not found: " + id)));
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
        return toResponse(medicalCareRepository.save(medicalCare));
    }

    @Transactional
    public MedicalCareResponse update(Long id, MedicalCareUpdateRequest request) {
        MedicalCare medicalCare = medicalCareRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medical care not found: " + id));
        mapCommon(medicalCare, request.patientId(), request.admissionId(), request.appointmentId(), request.doctorId(),
                request.consultationReason(), request.clinicalEvaluation(), request.diagnosis(),
                request.treatmentPlan(), request.requiresHospitalization());
        return toResponse(medicalCareRepository.save(medicalCare));
    }

    @Transactional
    public void delete(Long id) {
        if (!medicalCareRepository.existsById(id)) {
            throw new ResourceNotFoundException("Medical care not found: " + id);
        }
        medicalCareRepository.deleteById(id);
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
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + patientId));
        Staff doctor = staffRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found: " + doctorId));
        Admission admission = resolveAdmission(admissionId);
        Appointment appointment = resolveAppointment(appointmentId);

        validateFlowRules(admission, appointment);
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
                .orElseThrow(() -> new ResourceNotFoundException("Admission not found: " + admissionId));
    }

    private Appointment resolveAppointment(Long appointmentId) {
        if (appointmentId == null) {
            return null;
        }
        return appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));
    }

    private void validateFlowRules(Admission admission, Appointment appointment) {
        // Emergency flow can register care without admission, but normal consultation requires admission.
        if (admission == null && appointment != null) {
            throw new BusinessRuleException("Normal consultation requires an admission");
        }
    }

    private void validateOwnership(Long patientId, Admission admission, Appointment appointment) {
        if (admission != null && !admission.getPatient().getId().equals(patientId)) {
            throw new BusinessRuleException("Admission does not belong to the selected patient");
        }
        if (appointment != null && !appointment.getPatient().getId().equals(patientId)) {
            throw new BusinessRuleException("Appointment does not belong to the selected patient");
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
