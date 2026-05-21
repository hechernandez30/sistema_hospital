package com.hospital.specialty.entity;

import com.hospital.exception.BusinessRuleException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreRemove;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "especialidades", schema = "hospital")
@Getter
@Setter
@NoArgsConstructor
public class Specialty {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_especialidad")
    private Long id;

    @Column(name = "nombre", nullable = false, unique = true, length = 100)
    private String name;

    @Column(name = "duracion_minutos", nullable = false)
    private Integer durationMinutes;

    @Column(name = "activo", nullable = false)
    private boolean active = true;

    @PrePersist
    void onCreate() {
        if (!active) {
            active = true;
        }
    }

    @PreRemove
    void onPreRemove() {
        throw new BusinessRuleException(
                "No se permite eliminar físicamente una especialidad. Use la baja lógica (activo = false).");
    }
}
