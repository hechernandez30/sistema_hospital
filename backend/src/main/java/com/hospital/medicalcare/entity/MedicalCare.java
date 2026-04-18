package com.hospital.medicalcare.entity;

import com.hospital.admission.entity.Admission;
import com.hospital.appointment.entity.Appointment;
import com.hospital.patient.entity.Patient;
import com.hospital.staff.entity.Staff;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "atenciones_medicas", schema = "hospital")
@Getter
@Setter
@NoArgsConstructor
public class MedicalCare {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_atencion")
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "id_paciente", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_admision")
    private Admission admission;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_cita")
    private Appointment appointment;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "id_medico", nullable = false)
    private Staff doctor;

    @Column(name = "motivo_consulta", nullable = false, columnDefinition = "TEXT")
    private String consultationReason;

    @Column(name = "evaluacion_clinica", nullable = false, columnDefinition = "TEXT")
    private String clinicalEvaluation;

    @Column(name = "diagnostico", nullable = false, columnDefinition = "TEXT")
    private String diagnosis;

    @Column(name = "plan_tratamiento", columnDefinition = "TEXT")
    private String treatmentPlan;

    @Column(name = "requiere_hospitalizacion", nullable = false)
    private boolean requiresHospitalization;

    @Column(name = "fecha_atencion", nullable = false)
    private LocalDateTime careDate;

    @PrePersist
    void onCreate() {
        if (careDate == null) {
            careDate = LocalDateTime.now();
        }
    }
}
