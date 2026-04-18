package com.hospital.imaging.repository;

import com.hospital.imaging.entity.ImagingStudy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ImagingStudyRepository extends JpaRepository<ImagingStudy, Long> {

    boolean existsByMedicalOrder_Id(Long medicalOrderId);

    Optional<ImagingStudy> findByMedicalOrder_Id(Long medicalOrderId);
}
