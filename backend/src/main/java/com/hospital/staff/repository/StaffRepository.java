package com.hospital.staff.repository;

import com.hospital.staff.entity.Staff;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StaffRepository extends JpaRepository<Staff, Long> {

    Optional<Staff> findByUser_Id(Long userId);

    boolean existsByEmployeeCode(String employeeCode);

    @EntityGraph(attributePaths = {"user"})
    List<Staff> findByActiveTrue();

    @Override
    @EntityGraph(attributePaths = {"user"})
    List<Staff> findAll();

    @Query(
            """
            select s from Staff s
            left join fetch s.user
            left join fetch s.specialty
            where s.staffType = 'MEDICO'
            and (:specialtyId is null or s.specialty.id = :specialtyId)
            and (:active is null or s.active = :active)
            and (:attendance is null or s.attendance = :attendance)
            order by s.id asc
            """)
    List<Staff> findDoctorsForReport(
            @Param("specialtyId") Long specialtyId,
            @Param("active") Boolean active,
            @Param("attendance") String attendance);

    @Query(
            """
            select s from Staff s
            left join fetch s.user
            left join fetch s.specialty
            where s.staffType = 'MEDICO'
            and (:doctorId is null or s.id = :doctorId)
            and (:specialtyId is null or s.specialty.id = :specialtyId)
            order by s.id asc
            """)
    List<Staff> findDoctorsForProductivity(
            @Param("doctorId") Long doctorId, @Param("specialtyId") Long specialtyId);
}
