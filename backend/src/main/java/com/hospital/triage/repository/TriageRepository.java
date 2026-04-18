package com.hospital.triage.repository;

import com.hospital.triage.entity.Triage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TriageRepository extends JpaRepository<Triage, Long> {

    List<Triage> findByAdmission_Id(Long admissionId);
}
