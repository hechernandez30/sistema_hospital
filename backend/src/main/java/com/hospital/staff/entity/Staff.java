package com.hospital.staff.entity;

import com.hospital.specialty.entity.Specialty;
import com.hospital.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "personal", schema = "hospital")
@Getter
@Setter
@NoArgsConstructor
public class Staff {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_personal")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", unique = true)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_especialidad")
    private Specialty specialty;

    @Column(name = "tipo_personal", nullable = false, length = 30)
    private String staffType;

    @Column(name = "codigo_empleado", nullable = false, unique = true, length = 30)
    private String employeeCode;

    @Column(name = "numero_colegiado", length = 50)
    private String licenseNumber;

    @Column(name = "horario", length = 100)
    private String schedule;

    @Column(name = "asistencia", length = 20)
    private String attendance;

    @Column(name = "activo", nullable = false)
    private boolean active;

    @Column(name = "fecha_contratacion")
    private LocalDate hireDate;
}
