package com.hospital.medicalorder.repository;

import com.hospital.medicalorder.entity.MedicalOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface MedicalOrderRepository extends JpaRepository<MedicalOrder, Long> {

    List<MedicalOrder> findByMedicalCare_Id(Long medicalCareId);

    @Query(
            """
            select mo from MedicalOrder mo
            join fetch mo.medicalCare mc
            join fetch mc.patient
            join fetch mc.doctor d
            left join fetch d.user
            left join fetch d.specialty
            where d.staffType = 'MEDICO'
            and mo.orderDate >= :from and mo.orderDate < :to
            and (:doctorId is null or d.id = :doctorId)
            and (:specialtyId is null or d.specialty.id = :specialtyId)
            and (:orderType is null or mo.orderType = :orderType)
            and (:status is null or mo.status = :status)
            order by mo.orderDate asc, mo.id asc
            """)
    List<MedicalOrder> findDoctorReportRows(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("doctorId") Long doctorId,
            @Param("specialtyId") Long specialtyId,
            @Param("orderType") String orderType,
            @Param("status") String status);

    @Query(
            """
            select mc.doctor.id, count(mo) from MedicalOrder mo
            join mo.medicalCare mc
            where mc.doctor.staffType = 'MEDICO'
            and mo.orderDate >= :from and mo.orderDate < :to
            and (:doctorId is null or mc.doctor.id = :doctorId)
            group by mc.doctor.id
            """)
    List<Object[]> countMedicalOrdersByDoctor(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("doctorId") Long doctorId);
}
