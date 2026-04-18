package com.hospital.imaging.entity;

import com.hospital.medicalorder.entity.MedicalOrder;
import com.hospital.staff.entity.Staff;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "imagenes", schema = "hospital")
@Getter
@Setter
@NoArgsConstructor
public class ImagingStudy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_imagen")
    private Long id;

    @OneToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "id_orden", nullable = false, unique = true)
    private MedicalOrder medicalOrder;

    @Column(name = "tipo_estudio", nullable = false, length = 100)
    private String studyType;

    @Column(name = "fecha_programada")
    private LocalDateTime scheduledAt;

    @Column(name = "fecha_realizada")
    private LocalDateTime performedAt;

    @Column(name = "informe_resultado", columnDefinition = "TEXT")
    private String reportResult;

    @Column(name = "archivo_resultado", columnDefinition = "TEXT")
    private String resultFile;

    @Column(name = "estado", nullable = false, length = 20)
    private String status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_personal_responsable")
    private Staff responsibleStaff;

    @PrePersist
    void onCreate() {
        if (status == null) {
            status = "PENDIENTE";
        }
    }
}
