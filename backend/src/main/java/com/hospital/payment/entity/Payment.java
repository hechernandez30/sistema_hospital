package com.hospital.payment.entity;

import com.hospital.admission.entity.Admission;
import com.hospital.medicalorder.entity.MedicalOrder;
import com.hospital.patient.entity.Patient;
import com.hospital.user.entity.User;
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
@Table(name = "pagos", schema = "hospital")
@Getter
@Setter
@NoArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_pago")
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "id_paciente", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_admision")
    private Admission admission;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_orden")
    private MedicalOrder medicalOrder;

    @Column(name = "concepto", nullable = false, length = 200)
    private String concept;

    @Column(name = "subtotal", nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "porcentaje_seguro", nullable = false, precision = 5, scale = 2)
    private BigDecimal insurancePercent;

    @Column(name = "descuento_seguro", nullable = false, precision = 12, scale = 2)
    private BigDecimal insuranceDiscount;

    @Column(name = "copago", nullable = false, precision = 12, scale = 2)
    private BigDecimal copay;

    @Column(name = "total_pagar", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalToPay;

    @Column(name = "metodo_pago", length = 20)
    private String paymentMethod;

    @Column(name = "estado", nullable = false, length = 20)
    private String status;

    @Column(name = "numero_recibo", length = 50, unique = true)
    private String receiptNumber;

    @Column(name = "fecha_pago")
    private LocalDateTime paidAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registrado_por")
    private User registeredBy;

    @PrePersist
    void onCreate() {
        if (paidAt == null) {
            paidAt = LocalDateTime.now();
        }
    }
}
