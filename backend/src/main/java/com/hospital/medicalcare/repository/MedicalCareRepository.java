package com.hospital.medicalcare.repository;

import com.hospital.medicalcare.entity.MedicalCare;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MedicalCareRepository extends JpaRepository<MedicalCare, Long> {

    List<MedicalCare> findByPatient_Id(Long patientId);
}
