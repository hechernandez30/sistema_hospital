package com.hospital.appointment.entity;

import com.hospital.patient.entity.Patient;
import com.hospital.specialty.entity.Specialty;
import com.hospital.staff.entity.Staff;
import com.hospital.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "citas", schema = "hospital")
@Getter
@Setter
@NoArgsConstructor
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_cita")
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "id_paciente", nullable = false)
    private Patient patient;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "id_medico", nullable = false)
    private Staff doctor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_especialidad")
    private Specialty specialty;

    @Column(name = "fecha_hora_inicio", nullable = false)
    private LocalDateTime startAt;

    @Column(name = "fecha_hora_fin", nullable = false)
    private LocalDateTime endAt;

    @Column(name = "motivo", length = 250)
    private String reason;

    @Column(name = "estado", nullable = false, length = 20)
    private String status;

    @Column(name = "notificar_email", nullable = false)
    private boolean notifyEmail;

    @Column(name = "notificar_sms", nullable = false)
    private boolean notifySms;

    @Column(name = "notificar_whatsapp", nullable = false)
    private boolean notifyWhatsapp;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creado_por")
    private User createdBy;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "fecha_actualizacion", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (status == null) {
            status = "PROGRAMADA";
        }
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
