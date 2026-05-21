package com.hospital.laboratory.entity;

import com.hospital.exception.BusinessRuleException;
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
import jakarta.persistence.PreRemove;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "laboratorio", schema = "hospital")
@Getter
@Setter
@NoArgsConstructor
public class Laboratory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_laboratorio")
    private Long id;

    @OneToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "id_orden", nullable = false, unique = true)
    private MedicalOrder medicalOrder;

    @Column(name = "tipo_solicitante", length = 20)
    private String requesterType;

    @Column(name = "tipo_solicitud", length = 20)
    private String requestType;

    @Column(name = "numero_expediente", length = 40)
    private String recordNumber;

    @Column(name = "descripcion_muestra", columnDefinition = "TEXT")
    private String sampleDescription;

    @Column(name = "muestra_recibida", nullable = false)
    private boolean sampleReceived;

    @Column(name = "muestra_valida")
    private Boolean sampleValid;

    @Column(name = "incidencia", columnDefinition = "TEXT")
    private String incident;

    @Column(name = "resultado", columnDefinition = "TEXT")
    private String result;

    @Column(name = "adjunto", columnDefinition = "TEXT")
    private String attachment;

    @Column(name = "estado", nullable = false, length = 20)
    private String status;

    @Column(name = "fecha_recepcion")
    private LocalDateTime receptionAt;

    @Column(name = "fecha_resultado")
    private LocalDateTime resultAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_personal_responsable")
    private Staff responsibleStaff;

    @PrePersist
    void onCreate() {
        if (status == null) {
            status = "PENDIENTE";
        }
    }

    @PreRemove
    void onPreRemove() {
        throw new BusinessRuleException(
                "No se permite eliminar físicamente un registro de laboratorio. Use anulación (estado = ANULADO).");
    }
}
