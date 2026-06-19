package com.hospital.medicalorder.entity;

import com.hospital.medication.entity.Medication;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
        name = "lineas_orden_farmacia",
        schema = "hospital",
        uniqueConstraints = @UniqueConstraint(name = "uq_linea_orden_medicamento", columnNames = {"id_orden", "id_medicamento"}))
@Getter
@Setter
@NoArgsConstructor
public class PharmacyOrderLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_linea")
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "id_orden", nullable = false)
    private MedicalOrder medicalOrder;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "id_medicamento", nullable = false)
    private Medication medication;

    @Column(name = "cantidad", nullable = false)
    private Integer quantity;
}
