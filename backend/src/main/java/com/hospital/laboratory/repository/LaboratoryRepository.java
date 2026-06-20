package com.hospital.laboratory.repository;

import com.hospital.laboratory.entity.Laboratory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface LaboratoryRepository extends JpaRepository<Laboratory, Long> {

    boolean existsByMedicalOrder_Id(Long medicalOrderId);

    Optional<Laboratory> findByMedicalOrder_Id(Long medicalOrderId);

    List<Laboratory> findByStatus(String status);

    @Query("select l.recordNumber from Laboratory l where l.recordNumber is not null and l.recordNumber <> ''")
    List<String> findAllRecordNumbers();

    @Query(
            """
            select l from Laboratory l
            join fetch l.medicalOrder mo
            join fetch mo.medicalCare mc
            join fetch mc.patient
            join fetch mc.doctor d
            left join fetch d.user
            where d.staffType = 'MEDICO'
            and mo.orderDate >= :from and mo.orderDate < :to
            and (:doctorId is null or d.id = :doctorId)
            and (:specialtyId is null or d.specialty.id = :specialtyId)
            and (:status is null or l.status = :status)
            order by mo.orderDate asc, l.id asc
            """)
    List<Laboratory> findDoctorReportRows(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("doctorId") Long doctorId,
            @Param("specialtyId") Long specialtyId,
            @Param("status") String status);
}
