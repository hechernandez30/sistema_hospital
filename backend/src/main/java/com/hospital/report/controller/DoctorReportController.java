package com.hospital.report.controller;

import com.hospital.report.dto.DoctorAdmissionReportRow;
import com.hospital.report.dto.DoctorAppointmentReportRow;
import com.hospital.report.dto.DoctorCatalogReportRow;
import com.hospital.report.dto.DoctorImagingReportRow;
import com.hospital.report.dto.DoctorLaboratoryReportRow;
import com.hospital.report.dto.DoctorMedicalCareReportRow;
import com.hospital.report.dto.DoctorMedicalOrderReportRow;
import com.hospital.report.dto.DoctorProductivityReportRow;
import com.hospital.report.service.DoctorReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reports/doctors")
public class DoctorReportController {

    private final DoctorReportService doctorReportService;

    public DoctorReportController(DoctorReportService doctorReportService) {
        this.doctorReportService = doctorReportService;
    }

    @GetMapping("/catalog")
    public List<DoctorCatalogReportRow> catalog(
            @RequestParam(required = false) Long specialtyId,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String attendance) {
        return doctorReportService.catalog(specialtyId, active, attendance);
    }

    @GetMapping("/appointments")
    public List<DoctorAppointmentReportRow> appointments(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) Long specialtyId,
            @RequestParam(required = false) String status) {
        return doctorReportService.appointments(dateFrom, dateTo, doctorId, specialtyId, status);
    }

    @GetMapping("/medical-cares")
    public List<DoctorMedicalCareReportRow> medicalCares(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) Long specialtyId,
            @RequestParam(required = false) Boolean requiresHospitalization) {
        return doctorReportService.medicalCares(dateFrom, dateTo, doctorId, specialtyId, requiresHospitalization);
    }

    @GetMapping("/medical-orders")
    public List<DoctorMedicalOrderReportRow> medicalOrders(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) Long specialtyId,
            @RequestParam(required = false) String orderType,
            @RequestParam(required = false) String status) {
        return doctorReportService.medicalOrders(dateFrom, dateTo, doctorId, specialtyId, orderType, status);
    }

    @GetMapping("/admissions")
    public List<DoctorAdmissionReportRow> admissions(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) Long specialtyId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String admissionType) {
        return doctorReportService.admissions(dateFrom, dateTo, doctorId, specialtyId, status, admissionType);
    }

    @GetMapping("/productivity")
    public List<DoctorProductivityReportRow> productivity(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) Long specialtyId) {
        return doctorReportService.productivity(dateFrom, dateTo, doctorId, specialtyId);
    }

    @GetMapping("/laboratory")
    public List<DoctorLaboratoryReportRow> laboratory(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) Long specialtyId,
            @RequestParam(required = false) String status) {
        return doctorReportService.laboratory(dateFrom, dateTo, doctorId, specialtyId, status);
    }

    @GetMapping("/imaging")
    public List<DoctorImagingReportRow> imaging(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) Long specialtyId,
            @RequestParam(required = false) String status) {
        return doctorReportService.imaging(dateFrom, dateTo, doctorId, specialtyId, status);
    }
}
