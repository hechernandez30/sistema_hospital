package com.hospital.patient.entity;

import com.hospital.exception.BusinessRuleException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreRemove;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "pacientes", schema = "hospital")
@Getter
@Setter
@NoArgsConstructor
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_paciente")
    private Long id;

    @Column(name = "codigo_paciente", nullable = false, unique = true, length = 30)
    private String patientCode;

    @Column(name = "nombres", nullable = false, length = 100)
    private String firstName;

    @Column(name = "apellidos", nullable = false, length = 100)
    private String lastName;

    @Column(name = "dpi_nit", nullable = false, unique = true, length = 30)
    private String dpiNit;

    @Column(name = "fecha_nacimiento", nullable = false)
    private LocalDate birthDate;

    @Column(name = "sexo", length = 10)
    private String sex;

    @Column(name = "telefono", length = 20)
    private String phone;

    @Column(name = "correo", length = 150)
    private String email;

    @Column(name = "direccion", columnDefinition = "TEXT")
    private String address;

    @Column(name = "contacto_emergencia_nombre", length = 150)
    private String emergencyContactName;

    @Column(name = "contacto_emergencia_telefono", length = 20)
    private String emergencyContactPhone;

    @Column(name = "acepta_privacidad", nullable = false)
    private boolean privacyAccepted;

    @Column(name = "alergias", columnDefinition = "TEXT")
    private String allergies;

    @Column(name = "padecimientos", columnDefinition = "TEXT")
    private String conditions;

    @Column(name = "antecedentes", columnDefinition = "TEXT")
    private String medicalHistory;

    @Column(name = "medicamentos_actuales", columnDefinition = "TEXT")
    private String currentMedications;

    @Column(name = "activo", nullable = false)
    private boolean active;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "fecha_actualizacion", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /** Impide borrado físico vía JPA/Hibernate (DELETE debe ser baja lógica en {@code PatientService}). */
    @PreRemove
    void onPreRemove() {
        throw new BusinessRuleException(
                "No se permite eliminar físicamente un paciente. Use la baja lógica (activo = false).");
    }
}
