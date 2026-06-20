package com.hospital.medicalcare;

import com.hospital.exception.BusinessRuleException;
import com.hospital.medicalcare.entity.MedicalCare;
import com.hospital.security.JwtAuthenticationDetails;
import com.hospital.staff.repository.StaffRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Visibilidad de atenciones: ADMINISTRADOR y MEDICO-JEFE ven todas; MEDICO solo las asignadas a su personal.
 */
@Component
public class MedicalCareAccessSupport {

    private static final String ROLE_ADMIN = "ROLE_ADMINISTRADOR";
    private static final String ROLE_CHIEF = "ROLE_MEDICO-JEFE";

    private final StaffRepository staffRepository;

    public MedicalCareAccessSupport(StaffRepository staffRepository) {
        this.staffRepository = staffRepository;
    }

    public boolean canSeeAllMedicalCares() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return false;
        }
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> ROLE_ADMIN.equals(a) || ROLE_CHIEF.equals(a));
    }

    public Long requireCurrentDoctorStaffId() {
        Long userId = currentUserId()
                .orElseThrow(() -> new AccessDeniedException("No autenticado"));
        return staffRepository.findByUser_Id(userId)
                .filter(s -> "MEDICO".equalsIgnoreCase(s.getStaffType()) && s.isActive())
                .map(s -> s.getId())
                .orElseThrow(() -> new BusinessRuleException(
                        "Su usuario no tiene un registro activo de personal tipo MEDICO para consultar atenciones."));
    }

    public void assertCanAccess(MedicalCare medicalCare) {
        if (canSeeAllMedicalCares()) {
            return;
        }
        Long staffId = requireCurrentDoctorStaffId();
        if (!medicalCare.getDoctor().getId().equals(staffId)) {
            throw new AccessDeniedException("No tiene permiso para acceder a esta atención médica.");
        }
    }

    private static java.util.Optional<Long> currentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getDetails() instanceof JwtAuthenticationDetails details)) {
            return java.util.Optional.empty();
        }
        return java.util.Optional.ofNullable(details.userId());
    }
}
