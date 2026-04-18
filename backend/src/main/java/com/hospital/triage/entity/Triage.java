package com.hospital.triage.entity;

import com.hospital.admission.entity.Admission;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "triage", schema = "hospital")
@Getter
@Setter
@NoArgsConstructor
public class Triage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_triage")
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "id_admision", nullable = false)
    private Admission admission;

    @Column(name = "frecuencia_cardiaca")
    private Short heartRate;

    @Column(name = "frecuencia_respiratoria")
    private Short respiratoryRate;

    @Column(name = "presion_sistolica")
    private Short systolicPressure;

    @Column(name = "presion_diastolica")
    private Short diastolicPressure;

    @Column(name = "saturacion_oxigeno", precision = 5, scale = 2)
    private BigDecimal oxygenSaturation;

    @Column(name = "temperatura", precision = 4, scale = 1)
    private BigDecimal temperature;

    @Column(name = "dolor")
    private Short pain;

    @Column(name = "sintomas", columnDefinition = "TEXT")
    private String symptoms;

    @Column(name = "prioridad", nullable = false, length = 20)
    private String priority;

    @Column(name = "tiempo_objetivo_minutos")
    private Integer targetMinutes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_personal_responsable")
    private Staff responsibleStaff;

    @Column(name = "fecha_registro", nullable = false)
    private LocalDateTime registeredAt;

    @PrePersist
    void onCreate() {
        if (registeredAt == null) {
            registeredAt = LocalDateTime.now();
        }
    }
}
