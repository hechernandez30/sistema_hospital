package com.hospital.appointment.repository;

import com.hospital.appointment.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

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

    @Query(
            """
            select a from Appointment a
            join fetch a.patient
            join fetch a.doctor d
            left join fetch d.user
            where a.startAt >= :from and a.startAt < :to
            order by a.startAt asc, a.id asc
            """)
    List<Appointment> findReportRowsBetween(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    @Query(
            """
            select a from Appointment a
            join fetch a.patient
            join fetch a.doctor d
            left join fetch d.user
            where a.startAt >= :from and a.startAt < :to and a.status = :status
            order by a.startAt asc, a.id asc
            """)
    List<Appointment> findReportRowsBetweenAndStatus(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("status") String status);

    @Query(
            """
            select a from Appointment a
            join fetch a.patient
            join fetch a.doctor d
            left join fetch d.user
            left join fetch d.specialty
            where d.staffType = 'MEDICO'
            and a.startAt >= :from and a.startAt < :to
            and (:doctorId is null or d.id = :doctorId)
            and (:specialtyId is null or d.specialty.id = :specialtyId)
            and (:status is null or a.status = :status)
            order by a.startAt asc, a.id asc
            """)
    List<Appointment> findDoctorReportRows(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("doctorId") Long doctorId,
            @Param("specialtyId") Long specialtyId,
            @Param("status") String status);

    @Query(
            """
            select a.doctor.id, count(a) from Appointment a
            where a.doctor.staffType = 'MEDICO'
            and a.startAt >= :from and a.startAt < :to
            and (:doctorId is null or a.doctor.id = :doctorId)
            group by a.doctor.id
            """)
    List<Object[]> countAppointmentsByDoctor(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("doctorId") Long doctorId);

    @Query(
            """
            select a.doctor.id, count(a) from Appointment a
            where a.doctor.staffType = 'MEDICO'
            and a.status = 'ATENDIDA'
            and a.startAt >= :from and a.startAt < :to
            and (:doctorId is null or a.doctor.id = :doctorId)
            group by a.doctor.id
            """)
    List<Object[]> countAttendedAppointmentsByDoctor(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("doctorId") Long doctorId);

    @Query(
            """
            select a.doctor.id, count(a) from Appointment a
            where a.doctor.staffType = 'MEDICO'
            and a.status = 'NO_ASISTIO'
            and a.startAt >= :from and a.startAt < :to
            and (:doctorId is null or a.doctor.id = :doctorId)
            group by a.doctor.id
            """)
    List<Object[]> countNoShowAppointmentsByDoctor(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("doctorId") Long doctorId);

    @Query(
            """
            select a from Appointment a
            join fetch a.patient
            join fetch a.doctor d
            left join fetch d.user
            left join fetch a.specialty
            where a.id = :id
            """)
    Optional<Appointment> findByIdWithDetailsForNotification(@Param("id") Long id);
}
