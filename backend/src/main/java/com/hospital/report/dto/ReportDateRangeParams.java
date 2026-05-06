package com.hospital.report.dto;

import java.time.LocalDate;

public record ReportDateRangeParams(
        LocalDate dateFrom,
        LocalDate dateTo,
        String status
) {}
