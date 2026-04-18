package com.hospital.medicalorder.repository;

import com.hospital.medicalorder.entity.MedicalOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MedicalOrderRepository extends JpaRepository<MedicalOrder, Long> {

    List<MedicalOrder> findByMedicalCare_Id(Long medicalCareId);
}
