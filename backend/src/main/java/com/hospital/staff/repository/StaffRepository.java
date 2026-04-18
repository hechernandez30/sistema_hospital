package com.hospital.staff.repository;

import com.hospital.staff.entity.Staff;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StaffRepository extends JpaRepository<Staff, Long> {

    Optional<Staff> findByUser_Id(Long userId);

    boolean existsByEmployeeCode(String employeeCode);
}
