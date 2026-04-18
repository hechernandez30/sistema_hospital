package com.hospital.payment.repository;

import com.hospital.payment.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByPatient_Id(Long patientId);
}
