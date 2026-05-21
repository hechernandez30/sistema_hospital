package com.hospital.role.entity;

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
@Table(name = "roles", schema = "hospital")
@Getter
@Setter
@NoArgsConstructor
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_rol")
    private Long id;

    @Column(name = "nombre", nullable = false, unique = true, length = 50)
    private String name;

    @Column(name = "descripcion", length = 200)
    private String description;

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
                "No se permite eliminar físicamente un rol. Use la baja lógica (activo = false).");
    }
}
