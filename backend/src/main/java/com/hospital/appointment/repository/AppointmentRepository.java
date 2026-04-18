package com.hospital.appointment.repository;

import com.hospital.appointment.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    boolean existsByDoctor_IdAndStartAtAndStatusIn(Long doctorId, java.time.LocalDateTime startAt, java.util.Collection<String> statuses);
}
