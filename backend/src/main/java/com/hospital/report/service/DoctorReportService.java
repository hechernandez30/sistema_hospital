package com.hospital.report.service;

import com.hospital.admission.entity.Admission;
import com.hospital.admission.repository.AdmissionRepository;
import com.hospital.appointment.entity.Appointment;
import com.hospital.appointment.repository.AppointmentRepository;
import com.hospital.auditlog.BusinessAuditRecorder;
import com.hospital.exception.BusinessRuleException;
import com.hospital.imaging.entity.ImagingStudy;
import com.hospital.imaging.repository.ImagingStudyRepository;
import com.hospital.laboratory.entity.Laboratory;
import com.hospital.laboratory.repository.LaboratoryRepository;
import com.hospital.medicalcare.ChiefMedicalDoctorResolver;
import com.hospital.medicalcare.entity.MedicalCare;
import com.hospital.medicalcare.repository.MedicalCareRepository;
import com.hospital.medicalorder.entity.MedicalOrder;
import com.hospital.medicalorder.repository.MedicalOrderRepository;
import com.hospital.patient.entity.Patient;
import com.hospital.report.dto.DoctorAdmissionReportRow;
import com.hospital.report.dto.DoctorAppointmentReportRow;
import com.hospital.report.dto.DoctorCatalogReportRow;
import com.hospital.report.dto.DoctorImagingReportRow;
import com.hospital.report.dto.DoctorLaboratoryReportRow;
import com.hospital.report.dto.DoctorMedicalCareReportRow;
import com.hospital.report.dto.DoctorMedicalOrderReportRow;
import com.hospital.report.dto.DoctorProductivityReportRow;
import com.hospital.report.dto.DoctorTriageReportRow;
import com.hospital.specialty.entity.Specialty;
import com.hospital.staff.entity.Staff;
import com.hospital.staff.repository.StaffRepository;
import com.hospital.triage.entity.Triage;
import com.hospital.triage.repository.TriageRepository;
import com.hospital.user.entity.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class DoctorReportService {

    private static final String PENDING_MARKER = "PENDIENTE";

    private final StaffRepository staffRepository;
    private final AppointmentRepository appointmentRepository;
    private final MedicalCareRepository medicalCareRepository;
    private final MedicalOrderRepository medicalOrderRepository;
    private final AdmissionRepository admissionRepository;
    private final LaboratoryRepository laboratoryRepository;
    private final ImagingStudyRepository imagingStudyRepository;
    private final TriageRepository triageRepository;
    private final ChiefMedicalDoctorResolver chiefMedicalDoctorResolver;
    private final BusinessAuditRecorder businessAuditRecorder;

    public DoctorReportService(
            StaffRepository staffRepository,
            AppointmentRepository appointmentRepository,
            MedicalCareRepository medicalCareRepository,
            MedicalOrderRepository medicalOrderRepository,
            AdmissionRepository admissionRepository,
            LaboratoryRepository laboratoryRepository,
            ImagingStudyRepository imagingStudyRepository,
            TriageRepository triageRepository,
            ChiefMedicalDoctorResolver chiefMedicalDoctorResolver,
            BusinessAuditRecorder businessAuditRecorder) {
        this.staffRepository = staffRepository;
        this.appointmentRepository = appointmentRepository;
        this.medicalCareRepository = medicalCareRepository;
        this.medicalOrderRepository = medicalOrderRepository;
        this.admissionRepository = admissionRepository;
        this.laboratoryRepository = laboratoryRepository;
        this.imagingStudyRepository = imagingStudyRepository;
        this.triageRepository = triageRepository;
        this.chiefMedicalDoctorResolver = chiefMedicalDoctorResolver;
        this.businessAuditRecorder = businessAuditRecorder;
    }

    @Transactional(readOnly = true)
    public List<DoctorCatalogReportRow> catalog(Long specialtyId, Boolean active, String attendanceRaw) {
        String attendance = normalizeOptional(attendanceRaw);
        List<Staff> doctors = staffRepository.findDoctorsForReport(specialtyId, active, attendance);
        recordAudit("doctors-catalog", Map.of(
                "specialtyId", specialtyId == null ? "" : specialtyId,
                "active", active == null ? "" : active,
                "attendance", attendance == null ? "" : attendance));
        return doctors.stream().map(this::toCatalogRow).toList();
    }

    @Transactional(readOnly = true)
    public List<DoctorAppointmentReportRow> appointments(
            LocalDate dateFrom, LocalDate dateTo, Long doctorId, Long specialtyId, String statusRaw) {
        DateRange range = normalizeRange(dateFrom, dateTo);
        String status = normalizeOptional(statusRaw);
        List<Appointment> rows = appointmentRepository.findDoctorReportRows(
                range.from(), range.to(), doctorId, specialtyId, status);
        recordAudit("doctors-appointments", filterPayload(range, doctorId, specialtyId, status));
        return rows.stream().map(this::toAppointmentRow).toList();
    }

    @Transactional(readOnly = true)
    public List<DoctorMedicalCareReportRow> medicalCares(
            LocalDate dateFrom,
            LocalDate dateTo,
            Long doctorId,
            Long specialtyId,
            Boolean requiresHospitalization,
            Boolean pendingOnly,
            Boolean pendingReassignmentOnly) {
        DateRange range = normalizeRange(dateFrom, dateTo);
        Long chiefDoctorId = resolveChiefFilter(pendingReassignmentOnly, doctorId);
        Boolean effectivePendingOnly = Boolean.TRUE.equals(pendingOnly) || Boolean.TRUE.equals(pendingReassignmentOnly)
                ? true
                : null;

        List<MedicalCare> rows = medicalCareRepository.findDoctorReportRows(
                range.from(),
                range.to(),
                chiefDoctorId != null ? null : doctorId,
                specialtyId,
                requiresHospitalization,
                effectivePendingOnly,
                chiefDoctorId);

        Map<String, Object> filters = filterPayload(range, doctorId, specialtyId, null);
        filters.put("requiresHospitalization", requiresHospitalization == null ? "" : requiresHospitalization);
        filters.put("pendingOnly", pendingOnly == null ? "" : pendingOnly);
        filters.put("pendingReassignmentOnly", pendingReassignmentOnly == null ? "" : pendingReassignmentOnly);
        recordAudit("doctors-medical-cares", filters);
        return rows.stream().map(this::toMedicalCareRow).toList();
    }

    @Transactional(readOnly = true)
    public List<DoctorMedicalOrderReportRow> medicalOrders(
            LocalDate dateFrom,
            LocalDate dateTo,
            Long doctorId,
            Long specialtyId,
            String orderTypeRaw,
            String statusRaw) {
        DateRange range = normalizeRange(dateFrom, dateTo);
        String orderType = normalizeOptional(orderTypeRaw);
        String status = normalizeOptional(statusRaw);
        List<MedicalOrder> rows = medicalOrderRepository.findDoctorReportRows(
                range.from(), range.to(), doctorId, specialtyId, orderType, status);
        Map<String, Object> filters = filterPayload(range, doctorId, specialtyId, status);
        filters.put("orderType", orderType == null ? "" : orderType);
        recordAudit("doctors-medical-orders", filters);
        return rows.stream().map(this::toMedicalOrderRow).toList();
    }

    @Transactional(readOnly = true)
    public List<DoctorAdmissionReportRow> admissions(
            LocalDate dateFrom,
            LocalDate dateTo,
            Long doctorId,
            Long specialtyId,
            String statusRaw,
            String admissionTypeRaw) {
        DateRange range = normalizeRange(dateFrom, dateTo);
        String status = normalizeOptional(statusRaw);
        String admissionType = normalizeOptional(admissionTypeRaw);
        List<Admission> rows = admissionRepository.findDoctorReportRows(
                range.from(), range.to(), doctorId, specialtyId, status, admissionType);
        Map<Long, MedicalCare> careByAdmission = loadCareByAdmission(
                rows.stream().map(Admission::getId).toList());
        Map<String, Object> filters = filterPayload(range, doctorId, specialtyId, status);
        filters.put("admissionType", admissionType == null ? "" : admissionType);
        recordAudit("doctors-admissions", filters);
        return rows.stream().map(a -> toAdmissionRow(a, careByAdmission.get(a.getId()))).toList();
    }

    @Transactional(readOnly = true)
    public List<DoctorProductivityReportRow> productivity(
            LocalDate dateFrom, LocalDate dateTo, Long doctorId, Long specialtyId) {
        DateRange range = normalizeRange(dateFrom, dateTo);
        List<Staff> doctors = staffRepository.findDoctorsForProductivity(doctorId, specialtyId);
        Map<Long, long[]> countsByDoctor = new HashMap<>();
        mergeCounts(countsByDoctor, appointmentRepository.countAppointmentsByDoctor(range.from(), range.to(), doctorId), 0);
        mergeCounts(
                countsByDoctor,
                appointmentRepository.countAttendedAppointmentsByDoctor(range.from(), range.to(), doctorId),
                1);
        mergeCounts(
                countsByDoctor,
                appointmentRepository.countNoShowAppointmentsByDoctor(range.from(), range.to(), doctorId),
                2);
        mergeCounts(countsByDoctor, medicalCareRepository.countMedicalCaresByDoctor(range.from(), range.to(), doctorId), 3);
        mergeCounts(
                countsByDoctor,
                medicalCareRepository.countPendingMedicalCaresByDoctor(range.from(), range.to(), doctorId),
                4);
        mergeCounts(
                countsByDoctor, medicalOrderRepository.countMedicalOrdersByDoctor(range.from(), range.to(), doctorId), 5);
        mergeCounts(countsByDoctor, admissionRepository.countAdmissionsByDoctor(range.from(), range.to(), doctorId), 6);
        mergeCounts(
                countsByDoctor,
                laboratoryRepository.countCompletedLaboratoryByDoctor(range.from(), range.to(), doctorId),
                7);
        mergeCounts(
                countsByDoctor,
                laboratoryRepository.countPendingLaboratoryByDoctor(range.from(), range.to(), doctorId),
                8);
        mergeCounts(
                countsByDoctor,
                imagingStudyRepository.countCompletedImagingByDoctor(range.from(), range.to(), doctorId),
                9);

        recordAudit("doctors-productivity", filterPayload(range, doctorId, specialtyId, null));

        List<DoctorProductivityReportRow> rows = new ArrayList<>();
        for (Staff doctor : doctors) {
            long[] counts = countsByDoctor.getOrDefault(doctor.getId(), new long[10]);
            rows.add(new DoctorProductivityReportRow(
                    doctor.getId(),
                    staffDisplayName(doctor),
                    specialtyName(doctor.getSpecialty()),
                    counts[0],
                    counts[1],
                    counts[2],
                    counts[3],
                    counts[4],
                    counts[5],
                    counts[6],
                    counts[7],
                    counts[8],
                    counts[9]));
        }
        rows.sort(Comparator.comparing(DoctorProductivityReportRow::doctorName, String.CASE_INSENSITIVE_ORDER));
        return rows;
    }

    @Transactional(readOnly = true)
    public List<DoctorLaboratoryReportRow> laboratory(
            LocalDate dateFrom, LocalDate dateTo, Long doctorId, Long specialtyId, String statusRaw) {
        DateRange range = normalizeRange(dateFrom, dateTo);
        String status = normalizeOptional(statusRaw);
        List<Laboratory> rows =
                laboratoryRepository.findDoctorReportRows(range.from(), range.to(), doctorId, specialtyId, status);
        recordAudit("doctors-laboratory", filterPayload(range, doctorId, specialtyId, status));
        return rows.stream().map(this::toLaboratoryRow).toList();
    }

    @Transactional(readOnly = true)
    public List<DoctorImagingReportRow> imaging(
            LocalDate dateFrom, LocalDate dateTo, Long doctorId, Long specialtyId, String statusRaw) {
        DateRange range = normalizeRange(dateFrom, dateTo);
        String status = normalizeOptional(statusRaw);
        List<ImagingStudy> rows =
                imagingStudyRepository.findDoctorReportRows(range.from(), range.to(), doctorId, specialtyId, status);
        recordAudit("doctors-imaging", filterPayload(range, doctorId, specialtyId, status));
        return rows.stream().map(this::toImagingRow).toList();
    }

    @Transactional(readOnly = true)
    public List<DoctorTriageReportRow> triage(
            LocalDate dateFrom,
            LocalDate dateTo,
            Long doctorId,
            Long specialtyId,
            String priorityRaw) {
        DateRange range = normalizeRange(dateFrom, dateTo);
        String priority = normalizeOptional(priorityRaw);
        List<Triage> rows = triageRepository.findDoctorReportRows(
                range.from(), range.to(), doctorId, specialtyId, priority);
        Map<Long, MedicalCare> careByAdmission = loadCareByAdmission(
                rows.stream().map(t -> t.getAdmission().getId()).distinct().toList());
        Map<String, Object> filters = filterPayload(range, doctorId, specialtyId, null);
        filters.put("priority", priority == null ? "" : priority);
        recordAudit("doctors-triage", filters);
        return rows.stream()
                .map(t -> toTriageRow(t, careByAdmission.get(t.getAdmission().getId())))
                .toList();
    }

    private Map<Long, MedicalCare> loadCareByAdmission(List<Long> admissionIds) {
        if (admissionIds.isEmpty()) {
            return Map.of();
        }
        return medicalCareRepository.findByAdmission_IdIn(admissionIds).stream()
                .filter(mc -> mc.getAdmission() != null)
                .collect(Collectors.toMap(mc -> mc.getAdmission().getId(), mc -> mc, (a, b) -> a));
    }

    private DoctorTriageReportRow toTriageRow(Triage triage, MedicalCare care) {
        Admission admission = triage.getAdmission();
        Patient patient = admission.getPatient();
        Staff doctor = care != null ? care.getDoctor() : null;
        return new DoctorTriageReportRow(
                triage.getId(),
                admission.getId(),
                patient.getId(),
                patientDisplayName(patient),
                doctor != null ? doctor.getId() : null,
                doctor != null ? staffDisplayName(doctor) : "—",
                doctor != null ? specialtyName(doctor.getSpecialty()) : "—",
                admission.getAdmissionType(),
                triage.getPriority(),
                triage.getTargetMinutes(),
                triage.getRegisteredAt());
    }

    private Long resolveChiefFilter(Boolean pendingReassignmentOnly, Long doctorId) {
        if (!Boolean.TRUE.equals(pendingReassignmentOnly)) {
            return null;
        }
        if (doctorId != null) {
            return doctorId;
        }
        return chiefMedicalDoctorResolver.findChiefDoctorStaffId().orElse(null);
    }

    private DoctorCatalogReportRow toCatalogRow(Staff doctor) {
        return new DoctorCatalogReportRow(
                doctor.getId(),
                staffDisplayName(doctor),
                doctor.getEmployeeCode(),
                doctor.getLicenseNumber(),
                specialtyName(doctor.getSpecialty()),
                doctor.getSchedule(),
                doctor.getAttendance(),
                doctor.isActive(),
                doctor.getHireDate());
    }

    private DoctorAppointmentReportRow toAppointmentRow(Appointment appointment) {
        Staff doctor = appointment.getDoctor();
        return new DoctorAppointmentReportRow(
                appointment.getId(),
                appointment.getPatient().getId(),
                patientDisplayName(appointment.getPatient()),
                doctor.getId(),
                staffDisplayName(doctor),
                specialtyName(doctor.getSpecialty()),
                appointment.getReason(),
                appointment.isNotifyEmail(),
                appointment.getStartAt(),
                appointment.getEndAt(),
                appointment.getStatus());
    }

    private DoctorMedicalCareReportRow toMedicalCareRow(MedicalCare care) {
        Staff doctor = care.getDoctor();
        Admission admission = care.getAdmission();
        Appointment appointment = care.getAppointment();
        return new DoctorMedicalCareReportRow(
                care.getId(),
                care.getPatient().getId(),
                patientDisplayName(care.getPatient()),
                doctor.getId(),
                staffDisplayName(doctor),
                specialtyName(doctor.getSpecialty()),
                admission != null ? admission.getId() : null,
                appointment != null ? appointment.getId() : null,
                admission != null ? admission.getAdmissionType() : null,
                careStatus(care),
                isAutoGenerated(care),
                care.getDiagnosis(),
                care.isRequiresHospitalization(),
                care.getCareDate());
    }

    private DoctorMedicalOrderReportRow toMedicalOrderRow(MedicalOrder order) {
        MedicalCare care = order.getMedicalCare();
        Staff doctor = care.getDoctor();
        return new DoctorMedicalOrderReportRow(
                order.getId(),
                care.getId(),
                care.getPatient().getId(),
                patientDisplayName(care.getPatient()),
                doctor.getId(),
                staffDisplayName(doctor),
                specialtyName(doctor.getSpecialty()),
                order.getOrderType(),
                order.getStatus(),
                order.getPriority(),
                order.getOrderDate());
    }

    private DoctorAdmissionReportRow toAdmissionRow(Admission admission, MedicalCare care) {
        Appointment appointment = admission.getAppointment();
        Staff appointmentDoctor = appointment != null ? appointment.getDoctor() : null;
        Staff careDoctor = care != null ? care.getDoctor() : null;
        Staff doctor = careDoctor != null ? careDoctor : appointmentDoctor;
        String doctorSource = careDoctor != null ? "ATENCION" : appointmentDoctor != null ? "CITA" : "—";
        return new DoctorAdmissionReportRow(
                admission.getId(),
                admission.getPatient().getId(),
                patientDisplayName(admission.getPatient()),
                doctor != null ? doctor.getId() : null,
                doctor != null ? staffDisplayName(doctor) : "—",
                doctor != null ? specialtyName(doctor.getSpecialty()) : "—",
                appointment != null ? appointment.getId() : null,
                care != null ? care.getId() : null,
                doctorSource,
                admission.getAdmissionType(),
                admission.getStatus(),
                admission.getAdmissionDate(),
                admission.getDischargeDate());
    }

    private DoctorLaboratoryReportRow toLaboratoryRow(Laboratory laboratory) {
        MedicalOrder order = laboratory.getMedicalOrder();
        MedicalCare care = order.getMedicalCare();
        Staff doctor = care.getDoctor();
        return new DoctorLaboratoryReportRow(
                laboratory.getId(),
                order.getId(),
                care.getId(),
                care.getPatient().getId(),
                patientDisplayName(care.getPatient()),
                doctor.getId(),
                staffDisplayName(doctor),
                laboratory.getRecordNumber(),
                laboratory.getStatus(),
                laboratory.isSampleReceived(),
                hasText(laboratory.getAttachment()),
                order.getOrderDate(),
                laboratory.getReceptionAt(),
                laboratory.getResultAt());
    }

    private DoctorImagingReportRow toImagingRow(ImagingStudy imaging) {
        MedicalOrder order = imaging.getMedicalOrder();
        MedicalCare care = order.getMedicalCare();
        Staff doctor = care.getDoctor();
        return new DoctorImagingReportRow(
                imaging.getId(),
                order.getId(),
                care.getId(),
                care.getPatient().getId(),
                patientDisplayName(care.getPatient()),
                doctor.getId(),
                staffDisplayName(doctor),
                imaging.getStudyType(),
                imaging.getStatus(),
                hasText(imaging.getReportResult()) || hasText(imaging.getResultFile()),
                order.getOrderDate(),
                imaging.getScheduledAt(),
                imaging.getPerformedAt());
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private static boolean isPendingCare(MedicalCare care) {
        return PENDING_MARKER.equalsIgnoreCase(safeTrim(care.getDiagnosis()))
                || PENDING_MARKER.equalsIgnoreCase(safeTrim(care.getConsultationReason()));
    }

    private static String careStatus(MedicalCare care) {
        return isPendingCare(care) ? PENDING_MARKER : "COMPLETADA";
    }

    private static boolean isAutoGenerated(MedicalCare care) {
        return PENDING_MARKER.equalsIgnoreCase(safeTrim(care.getConsultationReason()))
                && PENDING_MARKER.equalsIgnoreCase(safeTrim(care.getDiagnosis()));
    }

    private static String safeTrim(String value) {
        return value == null ? "" : value.trim();
    }

    private static void mergeCounts(Map<Long, long[]> target, List<Object[]> source, int index) {
        for (Object[] row : source) {
            Long id = (Long) row[0];
            long count = (Long) row[1];
            target.computeIfAbsent(id, ignored -> new long[10])[index] = count;
        }
    }

    private void recordAudit(String reportType, Map<String, Object> filters) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("reportType", reportType);
        payload.put("filters", filters);
        businessAuditRecorder.safeRecord("reports", "DoctorReport", reportType, "READ", null, payload);
    }

    private static Map<String, Object> filterPayload(
            DateRange range, Long doctorId, Long specialtyId, String status) {
        Map<String, Object> filters = new LinkedHashMap<>();
        filters.put("dateFrom", range.dateFrom().toString());
        filters.put("dateTo", range.dateTo().toString());
        filters.put("doctorId", doctorId == null ? "" : doctorId);
        filters.put("specialtyId", specialtyId == null ? "" : specialtyId);
        filters.put("status", status == null ? "" : status);
        return filters;
    }

    private static DateRange normalizeRange(LocalDate from, LocalDate to) {
        if (from == null || to == null) {
            throw new BusinessRuleException("Debe enviar dateFrom y dateTo.");
        }
        if (from.isAfter(to)) {
            throw new BusinessRuleException("Rango inválido: dateFrom no puede ser mayor que dateTo.");
        }
        return new DateRange(from, to, from.atStartOfDay(), to.plusDays(1).atStartOfDay());
    }

    private static String normalizeOptional(String raw) {
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

    private static String specialtyName(Specialty specialty) {
        if (specialty == null || specialty.getName() == null || specialty.getName().isBlank()) {
            return "—";
        }
        return specialty.getName().trim();
    }

    private static String personName(String firstName, String lastName) {
        String first = firstName != null ? firstName.trim() : "";
        String last = lastName != null ? lastName.trim() : "";
        return (first + " " + last).trim();
    }

    private record DateRange(LocalDate dateFrom, LocalDate dateTo, LocalDateTime from, LocalDateTime to) {}
}
