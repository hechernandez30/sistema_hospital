package com.hospital.admission.entity;

import com.hospital.exception.BusinessRuleException;
import com.hospital.appointment.entity.Appointment;
import com.hospital.patient.entity.Patient;
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
import jakarta.persistence.PreRemove;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "admisiones", schema = "hospital")
@Getter
@Setter
@NoArgsConstructor
public class Admission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_admision")
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "id_paciente", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_cita")
    private Appointment appointment;

    @Column(name = "tipo_ingreso", nullable = false, length = 20)
    private String admissionType;

    @Column(name = "estado", nullable = false, length = 20)
    private String status;

    @Column(name = "area_actual", length = 100)
    private String currentArea;

    @Column(name = "habitacion", length = 30)
    private String room;

    @Column(name = "validacion_financiera_ok", nullable = false)
    private boolean financialValidationOk;

    @Column(name = "fuente_validacion", length = 20)
    private String validationSource;

    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observations;

    @Column(name = "fecha_ingreso", nullable = false)
    private LocalDateTime admissionDate;

    @Column(name = "fecha_alta")
    private LocalDateTime dischargeDate;

    @Column(name = "area_transferida", length = 100)
    private String transferredArea;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admitido_por")
    private User admittedBy;

    @PrePersist
    void onCreate() {
        if (status == null) {
            status = "ADMITIDO";
        }
        if (admissionDate == null) {
            admissionDate = LocalDateTime.now();
        }
    }

    @PreRemove
    void onPreRemove() {
        throw new BusinessRuleException(
                "No se permite eliminar físicamente una admisión. Use anulación (estado = ANULADO).");
    }
}
