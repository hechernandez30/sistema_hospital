package com.hospital.report.controller;

import com.hospital.report.dto.AdmissionReportRow;
import com.hospital.report.dto.AppointmentReportRow;
import com.hospital.report.dto.LaboratoryReportRow;
import com.hospital.report.dto.MedicationLowStockRow;
import com.hospital.report.dto.PaymentReportRow;
import com.hospital.report.dto.ReportDateRangeParams;
import com.hospital.report.service.ReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/appointments")
    public List<AppointmentReportRow> appointments(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) String status) {
        return reportService.appointments(new ReportDateRangeParams(dateFrom, dateTo, status));
    }

    @GetMapping("/admissions")
    public List<AdmissionReportRow> admissions(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) String status) {
        return reportService.admissions(new ReportDateRangeParams(dateFrom, dateTo, status));
    }

    @GetMapping("/payments")
    public List<PaymentReportRow> payments(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) String status) {
        return reportService.payments(new ReportDateRangeParams(dateFrom, dateTo, status));
    }

    @GetMapping("/medications/low-stock")
    public List<MedicationLowStockRow> medicationsLowStock() {
        return reportService.medicationsLowStock();
    }

    @GetMapping("/laboratory")
    public List<LaboratoryReportRow> laboratory(@RequestParam(required = false) String status) {
        return reportService.laboratoryByStatus(status);
    }
}
