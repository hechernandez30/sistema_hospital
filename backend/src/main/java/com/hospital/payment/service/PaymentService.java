package com.hospital.payment.service;

import com.hospital.admission.entity.Admission;
import com.hospital.admission.repository.AdmissionRepository;
import com.hospital.exception.BusinessRuleException;
import com.hospital.exception.ResourceNotFoundException;
import com.hospital.medicalorder.entity.MedicalOrder;
import com.hospital.medicalorder.repository.MedicalOrderRepository;
import com.hospital.patient.entity.Patient;
import com.hospital.patient.repository.PatientRepository;
import com.hospital.payment.dto.PaymentCreateRequest;
import com.hospital.payment.dto.PaymentResponse;
import com.hospital.payment.dto.PaymentUpdateRequest;
import com.hospital.payment.entity.Payment;
import com.hospital.payment.repository.PaymentRepository;
import com.hospital.user.entity.User;
import com.hospital.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final PatientRepository patientRepository;
    private final AdmissionRepository admissionRepository;
    private final MedicalOrderRepository medicalOrderRepository;
    private final UserRepository userRepository;

    public PaymentService(
            PaymentRepository paymentRepository,
            PatientRepository patientRepository,
            AdmissionRepository admissionRepository,
            MedicalOrderRepository medicalOrderRepository,
            UserRepository userRepository) {
        this.paymentRepository = paymentRepository;
        this.patientRepository = patientRepository;
        this.admissionRepository = admissionRepository;
        this.medicalOrderRepository = medicalOrderRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> findAll() {
        return paymentRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public PaymentResponse findById(Long id) {
        return toResponse(paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found: " + id)));
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> findByPatient(Long patientId) {
        return paymentRepository.findByPatient_Id(patientId).stream().map(this::toResponse).toList();
    }

    @Transactional
    public PaymentResponse create(PaymentCreateRequest request) {
        Patient patient = patientRepository.findById(request.patientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + request.patientId()));
        Admission admission = resolveAdmission(request.admissionId());
        MedicalOrder order = resolveOrder(request.medicalOrderId());
        validateOwnership(patient.getId(), admission, order);
        validatePaymentMethodForStatus(request.status(), request.paymentMethod());

        BigDecimal discount = computeInsuranceDiscount(request.subtotal(), request.insurancePercent());
        BigDecimal total = computeTotal(request.subtotal(), discount, request.copay());

        Payment payment = new Payment();
        payment.setPatient(patient);
        payment.setAdmission(admission);
        payment.setMedicalOrder(order);
        payment.setConcept(request.concept().trim());
        payment.setSubtotal(request.subtotal());
        payment.setInsurancePercent(request.insurancePercent());
        payment.setInsuranceDiscount(discount);
        payment.setCopay(request.copay());
        payment.setTotalToPay(total);
        payment.setPaymentMethod(blankToNull(request.paymentMethod()));
        payment.setStatus(request.status());
        payment.setReceiptNumber(blankToNull(request.receiptNumber()));
        payment.setRegisteredBy(resolveUser(request.registeredByUserId()));
        return toResponse(paymentRepository.save(payment));
    }

    @Transactional
    public PaymentResponse update(Long id, PaymentUpdateRequest request) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found: " + id));
        Patient patient = patientRepository.findById(request.patientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + request.patientId()));
        Admission admission = resolveAdmission(request.admissionId());
        MedicalOrder order = resolveOrder(request.medicalOrderId());
        validateOwnership(patient.getId(), admission, order);
        validatePaymentMethodForStatus(request.status(), request.paymentMethod());

        BigDecimal discount = computeInsuranceDiscount(request.subtotal(), request.insurancePercent());
        BigDecimal total = computeTotal(request.subtotal(), discount, request.copay());

        payment.setPatient(patient);
        payment.setAdmission(admission);
        payment.setMedicalOrder(order);
        payment.setConcept(request.concept().trim());
        payment.setSubtotal(request.subtotal());
        payment.setInsurancePercent(request.insurancePercent());
        payment.setInsuranceDiscount(discount);
        payment.setCopay(request.copay());
        payment.setTotalToPay(total);
        payment.setPaymentMethod(blankToNull(request.paymentMethod()));
        payment.setStatus(request.status());
        payment.setReceiptNumber(blankToNull(request.receiptNumber()));
        payment.setRegisteredBy(resolveUser(request.registeredByUserId()));
        return toResponse(paymentRepository.save(payment));
    }

    @Transactional
    public void delete(Long id) {
        if (!paymentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Payment not found: " + id);
        }
        paymentRepository.deleteById(id);
    }

    /**
     * Simple coverage: discount = subtotal × (insurancePercent / 100), rounded to 2 decimals (HALF_UP).
     */
    private BigDecimal computeInsuranceDiscount(BigDecimal subtotal, BigDecimal insurancePercent) {
        if (insurancePercent == null || insurancePercent.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return subtotal
                .multiply(insurancePercent)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal computeTotal(BigDecimal subtotal, BigDecimal insuranceDiscount, BigDecimal copay) {
        BigDecimal cop = copay != null ? copay : BigDecimal.ZERO;
        BigDecimal disc = insuranceDiscount != null ? insuranceDiscount : BigDecimal.ZERO;
        BigDecimal total = subtotal.subtract(disc).add(cop);
        if (total.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessRuleException("Total to pay cannot be negative");
        }
        return total.setScale(2, RoundingMode.HALF_UP);
    }

    private void validatePaymentMethodForStatus(String status, String paymentMethod) {
        if ("PAGADO".equals(status)) {
            if (paymentMethod == null || paymentMethod.isBlank()) {
                throw new BusinessRuleException("Payment method is required when status is PAGADO");
            }
        }
    }

    private void validateOwnership(Long patientId, Admission admission, MedicalOrder order) {
        if (admission != null && !admission.getPatient().getId().equals(patientId)) {
            throw new BusinessRuleException("Admission does not belong to the selected patient");
        }
        if (order != null && !order.getMedicalCare().getPatient().getId().equals(patientId)) {
            throw new BusinessRuleException("Medical order does not belong to the selected patient");
        }
    }

    private Admission resolveAdmission(Long admissionId) {
        if (admissionId == null) {
            return null;
        }
        return admissionRepository.findById(admissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Admission not found: " + admissionId));
    }

    private MedicalOrder resolveOrder(Long orderId) {
        if (orderId == null) {
            return null;
        }
        return medicalOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Medical order not found: " + orderId));
    }

    private User resolveUser(Long userId) {
        if (userId == null) {
            return null;
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
    }

    private static String blankToNull(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        return s;
    }

    private PaymentResponse toResponse(Payment p) {
        return new PaymentResponse(
                p.getId(),
                p.getPatient().getId(),
                p.getAdmission() != null ? p.getAdmission().getId() : null,
                p.getMedicalOrder() != null ? p.getMedicalOrder().getId() : null,
                p.getConcept(),
                p.getSubtotal(),
                p.getInsurancePercent(),
                p.getInsuranceDiscount(),
                p.getCopay(),
                p.getTotalToPay(),
                p.getPaymentMethod(),
                p.getStatus(),
                p.getReceiptNumber(),
                p.getPaidAt(),
                p.getRegisteredBy() != null ? p.getRegisteredBy().getId() : null);
    }
}
