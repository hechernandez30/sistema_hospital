package com.hospital.medication.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "medicamentos", schema = "hospital")
@Getter
@Setter
@NoArgsConstructor
public class Medication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_medicamento")
    private Long id;

    @Column(name = "nombre", nullable = false, length = 150)
    private String name;

    @Column(name = "presentacion", length = 100)
    private String presentation;

    @Column(name = "unidad", length = 30)
    private String unit;

    @Column(name = "stock_actual", nullable = false)
    private Integer currentStock;

    @Column(name = "stock_minimo", nullable = false)
    private Integer minimumStock;

    @Column(name = "activo", nullable = false)
    private boolean active;
}
