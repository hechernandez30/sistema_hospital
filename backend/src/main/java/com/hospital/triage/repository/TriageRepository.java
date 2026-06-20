package com.hospital.triage.repository;

import com.hospital.triage.entity.Triage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface TriageRepository extends JpaRepository<Triage, Long> {

    List<Triage> findByAdmission_Id(Long admissionId);

    @Query(
            """
            select t from Triage t
            join fetch t.admission a
            join fetch a.patient
            where a.admissionType = 'EMERGENCIA'
            and t.registeredAt >= :from and t.registeredAt < :to
            and (:doctorId is null or exists (
                select mc from com.hospital.medicalcare.entity.MedicalCare mc
                where mc.admission.id = a.id
                and mc.doctor.id = :doctorId
                and mc.doctor.staffType = 'MEDICO'))
            and (:specialtyId is null or exists (
                select mc2 from com.hospital.medicalcare.entity.MedicalCare mc2
                where mc2.admission.id = a.id
                and mc2.doctor.specialty.id = :specialtyId
                and mc2.doctor.staffType = 'MEDICO'))
            and (:priority is null or t.priority = :priority)
            order by t.registeredAt asc, t.id asc
            """)
    List<Triage> findDoctorReportRows(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("doctorId") Long doctorId,
            @Param("specialtyId") Long specialtyId,
            @Param("priority") String priority);
}
