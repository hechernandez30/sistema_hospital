package com.hospital.medicalorder.repository;

import com.hospital.medicalorder.entity.PharmacyOrderLine;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PharmacyOrderLineRepository extends JpaRepository<PharmacyOrderLine, Long> {

    List<PharmacyOrderLine> findByMedicalOrder_IdOrderByIdAsc(Long medicalOrderId);

    void deleteByMedicalOrder_Id(Long medicalOrderId);

    boolean existsByMedicalOrder_Id(Long medicalOrderId);
}
