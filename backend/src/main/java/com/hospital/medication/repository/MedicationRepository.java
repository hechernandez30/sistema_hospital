package com.hospital.medication.repository;

import com.hospital.medication.entity.Medication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface MedicationRepository extends JpaRepository<Medication, Long> {

    @Query("select m from Medication m where m.currentStock <= m.minimumStock order by m.currentStock asc, m.id asc")
    List<Medication> findLowStock();

    List<Medication> findByActiveTrue();
}
