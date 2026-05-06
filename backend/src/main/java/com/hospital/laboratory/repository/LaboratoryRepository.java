package com.hospital.laboratory.repository;

import com.hospital.laboratory.entity.Laboratory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LaboratoryRepository extends JpaRepository<Laboratory, Long> {

    boolean existsByMedicalOrder_Id(Long medicalOrderId);

    Optional<Laboratory> findByMedicalOrder_Id(Long medicalOrderId);

    List<Laboratory> findByStatus(String status);
}
