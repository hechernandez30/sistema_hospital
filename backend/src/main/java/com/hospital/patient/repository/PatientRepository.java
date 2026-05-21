package com.hospital.patient.repository;

import com.hospital.patient.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PatientRepository extends JpaRepository<Patient, Long> {

    boolean existsByPatientCode(String patientCode);

    boolean existsByDpiNit(String dpiNit);

    List<Patient> findByActiveTrue();

    /** Baja lógica: actualiza {@code activo} sin invocar {@code remove()} ni DELETE SQL sobre la fila. */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Patient p SET p.active = false WHERE p.id = :id AND p.active = true")
    int deactivateById(@Param("id") Long id);
}
