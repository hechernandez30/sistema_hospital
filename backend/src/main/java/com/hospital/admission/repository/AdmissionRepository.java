package com.hospital.admission.repository;

import com.hospital.admission.entity.Admission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface AdmissionRepository extends JpaRepository<Admission, Long> {

    List<Admission> findByAdmissionDateBetween(LocalDateTime from, LocalDateTime to);

    List<Admission> findByAdmissionDateBetweenAndStatus(LocalDateTime from, LocalDateTime to, String status);

    @Query(
            """
            select a from Admission a
            join fetch a.patient
            where a.admissionDate >= :from and a.admissionDate < :to
            order by a.admissionDate asc, a.id asc
            """)
    List<Admission> findReportRowsBetween(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    @Query(
            """
            select a from Admission a
            join fetch a.patient
            where a.admissionDate >= :from and a.admissionDate < :to and a.status = :status
            order by a.admissionDate asc, a.id asc
            """)
    List<Admission> findReportRowsBetweenAndStatus(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("status") String status);

    @Query(
            """
            select a from Admission a
            join fetch a.patient
            left join fetch a.appointment ap
            left join fetch ap.doctor d
            left join fetch d.user
            left join fetch d.specialty
            where a.admissionDate >= :from and a.admissionDate < :to
            and ap is not null and d.staffType = 'MEDICO'
            and (:doctorId is null or d.id = :doctorId)
            and (:specialtyId is null or d.specialty.id = :specialtyId)
            and (:status is null or a.status = :status)
            and (:admissionType is null or a.admissionType = :admissionType)
            order by a.admissionDate asc, a.id asc
            """)
    List<Admission> findDoctorReportRows(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("doctorId") Long doctorId,
            @Param("specialtyId") Long specialtyId,
            @Param("status") String status,
            @Param("admissionType") String admissionType);

    @Query(
            """
            select ap.doctor.id, count(a) from Admission a
            join a.appointment ap
            where ap.doctor.staffType = 'MEDICO'
            and a.admissionDate >= :from and a.admissionDate < :to
            and (:doctorId is null or ap.doctor.id = :doctorId)
            group by ap.doctor.id
            """)
    List<Object[]> countAdmissionsByDoctor(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("doctorId") Long doctorId);
}
