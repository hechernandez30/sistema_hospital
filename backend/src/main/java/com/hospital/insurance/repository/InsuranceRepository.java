package com.hospital.insurance.repository;

import com.hospital.insurance.entity.Insurance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InsuranceRepository extends JpaRepository<Insurance, Long> {

    List<Insurance> findByPatient_Id(Long patientId);

    List<Insurance> findByPatient_IdAndActiveTrue(Long patientId);

    Optional<Insurance> findByIdAndPatient_Id(Long id, Long patientId);
}
