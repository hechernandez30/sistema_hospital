package com.hospital.medicalorder.entity;

import com.hospital.medicalcare.entity.MedicalCare;
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
@Table(name = "ordenes_medicas", schema = "hospital")
@Getter
@Setter
@NoArgsConstructor
public class MedicalOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_orden")
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "id_atencion", nullable = false)
    private MedicalCare medicalCare;

    @Column(name = "tipo_orden", nullable = false, length = 20)
    private String orderType;

    @Column(name = "descripcion", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "prioridad", nullable = false, length = 20)
    private String priority;

    @Column(name = "estado", nullable = false, length = 20)
    private String status;

    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observations;

    @Column(name = "fecha_orden", nullable = false)
    private LocalDateTime orderDate;

    @PrePersist
    void onCreate() {
        if (priority == null) {
            priority = "NORMAL";
        }
        if (status == null) {
            status = "PENDIENTE";
        }
        if (orderDate == null) {
            orderDate = LocalDateTime.now();
        }
    }
}
