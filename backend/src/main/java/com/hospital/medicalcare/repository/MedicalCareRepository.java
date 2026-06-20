package com.hospital.medicalcare.repository;

import com.hospital.medicalcare.entity.MedicalCare;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface MedicalCareRepository extends JpaRepository<MedicalCare, Long> {

    List<MedicalCare> findByPatient_Id(Long patientId);

    List<MedicalCare> findByDoctor_Id(Long doctorId);

    List<MedicalCare> findByDoctor_IdAndPatient_Id(Long doctorId, Long patientId);

    boolean existsByAdmission_Id(Long admissionId);

    Optional<MedicalCare> findFirstByAdmission_Id(Long admissionId);

    @Query(
            """
            select mc from MedicalCare mc
            join fetch mc.doctor d
            left join fetch d.specialty
            where mc.admission.id in :admissionIds
            """)
    List<MedicalCare> findByAdmission_IdIn(@Param("admissionIds") List<Long> admissionIds);

    @Query(
            """
            select mc from MedicalCare mc
            join fetch mc.patient
            join fetch mc.doctor d
            left join fetch d.user
            left join fetch d.specialty
            left join fetch mc.admission
            left join fetch mc.appointment
            where d.staffType = 'MEDICO'
            and mc.careDate >= :from and mc.careDate < :to
            and (:doctorId is null or d.id = :doctorId)
            and (:specialtyId is null or d.specialty.id = :specialtyId)
            and (:requiresHospitalization is null or mc.requiresHospitalization = :requiresHospitalization)
            and (:pendingOnly is null or :pendingOnly = false
                or upper(trim(mc.diagnosis)) = 'PENDIENTE'
                or upper(trim(mc.consultationReason)) = 'PENDIENTE')
            and (:chiefDoctorId is null or d.id = :chiefDoctorId)
            order by mc.careDate asc, mc.id asc
            """)
    List<MedicalCare> findDoctorReportRows(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("doctorId") Long doctorId,
            @Param("specialtyId") Long specialtyId,
            @Param("requiresHospitalization") Boolean requiresHospitalization,
            @Param("pendingOnly") Boolean pendingOnly,
            @Param("chiefDoctorId") Long chiefDoctorId);

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

    @Query(
            """
            select mc.doctor.id, count(mc) from MedicalCare mc
            where mc.doctor.staffType = 'MEDICO'
            and mc.careDate >= :from and mc.careDate < :to
            and (upper(trim(mc.diagnosis)) = 'PENDIENTE' or upper(trim(mc.consultationReason)) = 'PENDIENTE')
            and (:doctorId is null or mc.doctor.id = :doctorId)
            group by mc.doctor.id
            """)
    List<Object[]> countPendingMedicalCaresByDoctor(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("doctorId") Long doctorId);
}
