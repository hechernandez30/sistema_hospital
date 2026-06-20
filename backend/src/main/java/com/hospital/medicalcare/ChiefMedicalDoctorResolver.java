package com.hospital.medicalcare;

import com.hospital.exception.BusinessRuleException;
import com.hospital.staff.entity.Staff;
import com.hospital.staff.repository.StaffRepository;
import com.hospital.user.entity.User;
import com.hospital.user.repository.UserRepository;
import org.springframework.stereotype.Component;

/**
 * Resuelve el registro de personal del único usuario con rol {@code MEDICO-JEFE}.
 */
@Component
public class ChiefMedicalDoctorResolver {

    public static final String CHIEF_MEDICAL_ROLE_NAME = "MEDICO-JEFE";

    private final UserRepository userRepository;
    private final StaffRepository staffRepository;

    public ChiefMedicalDoctorResolver(UserRepository userRepository, StaffRepository staffRepository) {
        this.userRepository = userRepository;
        this.staffRepository = staffRepository;
    }

    public Staff resolveChiefDoctorStaff() {
        var chiefs = userRepository.findActiveByRoleName(CHIEF_MEDICAL_ROLE_NAME);
        if (chiefs.isEmpty()) {
            throw new BusinessRuleException(
                    "No existe un usuario activo con rol MEDICO-JEFE. Configure el jefe médico antes de admitir pacientes.");
        }
        if (chiefs.size() > 1) {
            throw new BusinessRuleException(
                    "Hay más de un usuario activo con rol MEDICO-JEFE. Debe existir exactamente uno.");
        }
        User chief = chiefs.get(0);
        Staff staff = staffRepository.findByUser_Id(chief.getId())
                .orElseThrow(() -> new BusinessRuleException(
                        "El usuario con rol MEDICO-JEFE no tiene registro vinculado en personal. "
                                + "Asocie el usuario al personal tipo MEDICO."));
        if (!"MEDICO".equalsIgnoreCase(staff.getStaffType())) {
            throw new BusinessRuleException(
                    "El personal vinculado al MEDICO-JEFE debe ser de tipo MEDICO.");
        }
        if (!staff.isActive()) {
            throw new BusinessRuleException(
                    "El personal vinculado al MEDICO-JEFE está inactivo.");
        }
        return staff;
    }
}
