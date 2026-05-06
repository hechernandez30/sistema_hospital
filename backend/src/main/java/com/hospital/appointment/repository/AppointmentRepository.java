package com.hospital.appointment.repository;

import com.hospital.appointment.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    /**
     * Dos intervalos [startAt, endAt) se traslapán si empiezan antes del fin del otro (extremos contiguos no cuentan).
     */
    @Query(
            """
            select count(a) from Appointment a
            where a.doctor.id = :doctorId
            and a.status in :statuses
            and :startAt < a.endAt
            and a.startAt < :endAt
            and (:excludeId is null or a.id <> :excludeId)
            """)
    long countActiveOverlapInterval(
            @Param("doctorId") Long doctorId,
            @Param("startAt") LocalDateTime startAt,
            @Param("endAt") LocalDateTime endAt,
            @Param("statuses") Collection<String> statuses,
            @Param("excludeId") Long excludeId);

    List<Appointment> findByStartAtBetween(LocalDateTime from, LocalDateTime to);

    List<Appointment> findByStartAtBetweenAndStatus(LocalDateTime from, LocalDateTime to, String status);
}
