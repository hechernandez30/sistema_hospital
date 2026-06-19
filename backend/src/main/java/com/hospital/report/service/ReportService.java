package com.hospital.report.service;

import com.hospital.admission.entity.Admission;
import com.hospital.admission.repository.AdmissionRepository;
import com.hospital.appointment.entity.Appointment;
import com.hospital.appointment.repository.AppointmentRepository;
import com.hospital.auditlog.BusinessAuditRecorder;
import com.hospital.exception.BusinessRuleException;
import com.hospital.laboratory.entity.Laboratory;
import com.hospital.laboratory.repository.LaboratoryRepository;
import com.hospital.medication.entity.Medication;
import com.hospital.medication.repository.MedicationRepository;
import com.hospital.payment.entity.Payment;
import com.hospital.payment.repository.PaymentRepository;
import com.hospital.report.dto.AdmissionReportRow;
import com.hospital.report.dto.AppointmentReportRow;
import com.hospital.report.dto.LaboratoryReportRow;
import com.hospital.report.dto.MedicationLowStockRow;
import com.hospital.report.dto.PaymentReportRow;
import com.hospital.report.dto.ReportDateRangeParams;
import com.hospital.patient.entity.Patient;
import com.hospital.staff.entity.Staff;
import com.hospital.user.entity.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReportService {

    private final AppointmentRepository appointmentRepository;
    private final AdmissionRepository admissionRepository;
    private final PaymentRepository paymentRepository;
    private final MedicationRepository medicationRepository;
    private final LaboratoryRepository laboratoryRepository;
    private final BusinessAuditRecorder businessAuditRecorder;

    public ReportService(
            AppointmentRepository appointmentRepository,
            AdmissionRepository admissionRepository,
            PaymentRepository paymentRepository,
            MedicationRepository medicationRepository,
            LaboratoryRepository laboratoryRepository,
            BusinessAuditRecorder businessAuditRecorder) {
        this.appointmentRepository = appointmentRepository;
        this.admissionRepository = admissionRepository;
        this.paymentRepository = paymentRepository;
        this.medicationRepository = medicationRepository;
        this.laboratoryRepository = laboratoryRepository;
        this.businessAuditRecorder = businessAuditRecorder;
    }

    @Transactional(readOnly = true)
    public List<AppointmentReportRow> appointments(ReportDateRangeParams params) {
        DateRange range = normalizeRange(params.dateFrom(), params.dateTo());
        String status = normalizeStatus(params.status());
        List<Appointment> rows = status == null
                ? appointmentRepository.findReportRowsBetween(range.from(), range.to())
                : appointmentRepository.findReportRowsBetweenAndStatus(range.from(), range.to(), status);
        recordAudit("appointments", params, status);
        return rows.stream()
                .map(r -> new AppointmentReportRow(
                        r.getId(),
                        r.getPatient().getId(),
                        patientDisplayName(r.getPatient()),
                        r.getDoctor().getId(),
                        staffDisplayName(r.getDoctor()),
                        r.getStartAt(),
                        r.getEndAt(),
                        r.getStatus()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AdmissionReportRow> admissions(ReportDateRangeParams params) {
        DateRange range = normalizeRange(params.dateFrom(), params.dateTo());
        String status = normalizeStatus(params.status());
        List<Admission> rows = status == null
                ? admissionRepository.findReportRowsBetween(range.from(), range.to())
                : admissionRepository.findReportRowsBetweenAndStatus(range.from(), range.to(), status);
        recordAudit("admissions", params, status);
        return rows.stream()
                .map(r -> new AdmissionReportRow(
                        r.getId(),
                        r.getPatient().getId(),
                        patientDisplayName(r.getPatient()),
                        r.getAdmissionType(),
                        r.getStatus(),
                        r.getAdmissionDate(),
                        r.getDischargeDate()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PaymentReportRow> payments(ReportDateRangeParams params) {
        DateRange range = normalizeRange(params.dateFrom(), params.dateTo());
        String status = normalizeStatus(params.status());
        List<Payment> rows = status == null
                ? paymentRepository.findByPaidAtBetween(range.from(), range.to())
                : paymentRepository.findByPaidAtBetweenAndStatus(range.from(), range.to(), status);
        recordAudit("payments", params, status);
        return rows.stream()
                .map(r -> new PaymentReportRow(
                        r.getId(),
                        r.getPatient().getId(),
                        r.getStatus(),
                        r.getPaymentMethod(),
                        r.getTotalToPay(),
                        r.getPaidAt()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MedicationLowStockRow> medicationsLowStock() {
        List<Medication> rows = medicationRepository.findLowStock();
        businessAuditRecorder.safeRecord("reports", "OperationalReport", "medications-low-stock", "READ", null, Map.of(
                "reportType", "medications-low-stock",
                "filters", Map.of("lowStock", true)));
        return rows.stream()
                .map(r -> new MedicationLowStockRow(
                        r.getId(),
                        r.getName(),
                        r.getCurrentStock(),
                        r.getMinimumStock(),
                        r.isActive()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LaboratoryReportRow> laboratoryByStatus(String statusRaw) {
        String status = normalizeStatus(statusRaw);
        List<Laboratory> rows = status == null
                ? laboratoryRepository.findAll()
                : laboratoryRepository.findByStatus(status);
        businessAuditRecorder.safeRecord("reports", "OperationalReport", "laboratory", "READ", null, Map.of(
                "reportType", "laboratory",
                "filters", Map.of("status", status == null ? "" : status)));
        return rows.stream()
                .map(r -> new LaboratoryReportRow(
                        r.getId(),
                        r.getMedicalOrder().getId(),
                        r.getStatus(),
                        r.isSampleReceived(),
                        r.getReceptionAt(),
                        r.getResultAt()))
                .toList();
    }

    private void recordAudit(String reportType, ReportDateRangeParams params, String normalizedStatus) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("reportType", reportType);
        payload.put("dateFrom", params.dateFrom().toString());
        payload.put("dateTo", params.dateTo().toString());
        payload.put("filters", Map.of("status", normalizedStatus == null ? "" : normalizedStatus));
        businessAuditRecorder.safeRecord("reports", "OperationalReport", reportType, "READ", null, payload);
    }

    private static DateRange normalizeRange(LocalDate from, LocalDate to) {
        if (from == null || to == null) {
            throw new BusinessRuleException("Debe enviar dateFrom y dateTo.");
        }
        if (from.isAfter(to)) {
            throw new BusinessRuleException("Rango inválido: dateFrom no puede ser mayor que dateTo.");
        }
        return new DateRange(from.atStartOfDay(), to.plusDays(1).atStartOfDay());
    }

    private static String normalizeStatus(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        return raw.trim().toUpperCase();
    }

    private static String patientDisplayName(Patient patient) {
        return personName(patient.getFirstName(), patient.getLastName());
    }

    private static String staffDisplayName(Staff staff) {
        User user = staff.getUser();
        if (user != null) {
            String name = personName(user.getFirstName(), user.getLastName());
            if (!name.isBlank()) {
                return name;
            }
        }
        if (staff.getEmployeeCode() != null && !staff.getEmployeeCode().isBlank()) {
            return staff.getEmployeeCode().trim();
        }
        return "Personal " + staff.getId();
    }

    private static String personName(String firstName, String lastName) {
        String first = firstName != null ? firstName.trim() : "";
        String last = lastName != null ? lastName.trim() : "";
        return (first + " " + last).trim();
    }

    private record DateRange(LocalDateTime from, LocalDateTime to) {}
}
