package com.hospital.medicalcare.repository;

import com.hospital.medicalcare.entity.MedicalCare;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface MedicalCareRepository extends JpaRepository<MedicalCare, Long> {

    List<MedicalCare> findByPatient_Id(Long patientId);

    List<MedicalCare> findByDoctor_Id(Long doctorId);

    List<MedicalCare> findByDoctor_IdAndPatient_Id(Long doctorId, Long patientId);

    boolean existsByAdmission_Id(Long admissionId);

    @Query(
            """
            select mc from MedicalCare mc
            join fetch mc.patient
            join fetch mc.doctor d
            left join fetch d.user
            left join fetch d.specialty
            where d.staffType = 'MEDICO'
            and mc.careDate >= :from and mc.careDate < :to
            and (:doctorId is null or d.id = :doctorId)
            and (:specialtyId is null or d.specialty.id = :specialtyId)
            and (:requiresHospitalization is null or mc.requiresHospitalization = :requiresHospitalization)
            order by mc.careDate asc, mc.id asc
            """)
    List<MedicalCare> findDoctorReportRows(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("doctorId") Long doctorId,
            @Param("specialtyId") Long specialtyId,
            @Param("requiresHospitalization") Boolean requiresHospitalization);

    @Query(
            """
            select mc.doctor.id, count(mc) from MedicalCare mc
            where mc.doctor.staffType = 'MEDICO'
            and mc.careDate >= :from and mc.careDate < :to
            and (:doctorId is null or mc.doctor.id = :doctorId)
            group by mc.doctor.id
            """)
    List<Object[]> countMedicalCaresByDoctor(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("doctorId") Long doctorId);
}
