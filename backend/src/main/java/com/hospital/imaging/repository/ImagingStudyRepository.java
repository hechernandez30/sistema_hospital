package com.hospital.imaging.repository;

import com.hospital.imaging.entity.ImagingStudy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ImagingStudyRepository extends JpaRepository<ImagingStudy, Long> {

    boolean existsByMedicalOrder_Id(Long medicalOrderId);

    Optional<ImagingStudy> findByMedicalOrder_Id(Long medicalOrderId);

    @Query(
            """
            select i from ImagingStudy i
            join fetch i.medicalOrder mo
            join fetch mo.medicalCare mc
            join fetch mc.patient
            join fetch mc.doctor d
            left join fetch d.user
            where d.staffType = 'MEDICO'
            and mo.orderDate >= :from and mo.orderDate < :to
            and (:doctorId is null or d.id = :doctorId)
            and (:specialtyId is null or d.specialty.id = :specialtyId)
            and (:status is null or i.status = :status)
            order by mo.orderDate asc, i.id asc
            """)
    List<ImagingStudy> findDoctorReportRows(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("doctorId") Long doctorId,
            @Param("specialtyId") Long specialtyId,
            @Param("status") String status);
}
