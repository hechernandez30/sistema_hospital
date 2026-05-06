package com.hospital.admission.repository;

import com.hospital.admission.entity.Admission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface AdmissionRepository extends JpaRepository<Admission, Long> {

    List<Admission> findByAdmissionDateBetween(LocalDateTime from, LocalDateTime to);

    List<Admission> findByAdmissionDateBetweenAndStatus(LocalDateTime from, LocalDateTime to, String status);
}
