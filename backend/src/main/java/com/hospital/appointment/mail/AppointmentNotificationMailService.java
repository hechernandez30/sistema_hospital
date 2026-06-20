package com.hospital.appointment.mail;

import com.hospital.appointment.entity.Appointment;
import com.hospital.mail.MailProperties;
import com.hospital.patient.entity.Patient;
import com.hospital.specialty.entity.Specialty;
import com.hospital.staff.entity.Staff;
import com.hospital.user.entity.User;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
public class AppointmentNotificationMailService {

    private static final Logger log = LoggerFactory.getLogger(AppointmentNotificationMailService.class);
    private static final DateTimeFormatter DATE_TIME_FMT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm", Locale.forLanguageTag("es-GT"));

    private final JavaMailSender mailSender;
    private final MailProperties mailProperties;
    private final String mailUsername;

    public AppointmentNotificationMailService(
            JavaMailSender mailSender,
            MailProperties mailProperties,
            @Value("${spring.mail.username:}") String mailUsername) {
        this.mailSender = mailSender;
        this.mailProperties = mailProperties;
        this.mailUsername = mailUsername == null ? "" : mailUsername.trim();
    }

    public void sendIfRequested(Appointment appointment, AppointmentEmailNotificationEvent.Kind kind) {
        if (!appointment.isNotifyEmail()) {
            return;
        }
        if (!mailProperties.isOperational()) {
            log.warn("Correo de cita #{} omitido: app.mail no está habilitado o falta remitente.", appointment.getId());
            return;
        }
        if (mailUsername.isBlank()) {
            log.warn("Correo de cita #{} omitido: spring.mail.username no configurado.", appointment.getId());
            return;
        }

        Patient patient = appointment.getPatient();
        String recipient = patient.getEmail() != null ? patient.getEmail().trim() : "";
        if (recipient.isBlank()) {
            log.warn(
                    "Correo de cita #{} omitido: paciente #{} sin correo en expediente.",
                    appointment.getId(),
                    patient.getId());
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(mailProperties.fromAddress(), mailProperties.fromName());
            helper.setTo(recipient);
            helper.setSubject(buildSubject(kind, appointment.getId()));
            helper.setText(buildBody(appointment, kind, patientName(patient)), false);
            mailSender.send(message);
            log.info("Correo de cita {} enviado a {} (cita #{}).", kind, recipient, appointment.getId());
        } catch (MessagingException ex) {
            log.error("No se pudo enviar correo de cita #{} a {}: {}", appointment.getId(), recipient, ex.getMessage());
        } catch (Exception ex) {
            log.error("Error inesperado al enviar correo de cita #{}: {}", appointment.getId(), ex.getMessage());
        }
    }

    private String buildSubject(AppointmentEmailNotificationEvent.Kind kind, Long appointmentId) {
        return switch (kind) {
            case CREATED -> "Confirmación de cita #" + appointmentId + " — " + mailProperties.fromName();
            case UPDATED -> "Actualización de cita #" + appointmentId + " — " + mailProperties.fromName();
            case CANCELLED -> "Cancelación de cita #" + appointmentId + " — " + mailProperties.fromName();
        };
    }

    private String buildBody(Appointment appointment, AppointmentEmailNotificationEvent.Kind kind, String patientName) {
        String doctorName = staffDisplayName(appointment.getDoctor());
        Specialty specialty = appointment.getSpecialty();
        String specialtyLine = specialty != null && specialty.getName() != null
                ? specialty.getName().trim()
                : "—";
        String reason = appointment.getReason() != null && !appointment.getReason().isBlank()
                ? appointment.getReason().trim()
                : "—";
        String intro = switch (kind) {
            case CREATED -> "Su cita ha sido registrada correctamente.";
            case UPDATED -> "Su cita ha sido actualizada.";
            case CANCELLED -> "Su cita ha sido cancelada.";
        };

        return """
                Estimado/a %s,

                %s

                Detalle de la cita:
                - Número: %d
                - Médico: %s
                - Especialidad: %s
                - Inicio: %s
                - Fin: %s
                - Estado: %s
                - Motivo: %s

                Si necesita reprogramar, comuníquese con recepción.

                Atentamente,
                %s
                """
                .formatted(
                        patientName,
                        intro,
                        appointment.getId(),
                        doctorName,
                        specialtyLine,
                        DATE_TIME_FMT.format(appointment.getStartAt()),
                        DATE_TIME_FMT.format(appointment.getEndAt()),
                        appointment.getStatus(),
                        reason,
                        mailProperties.fromName());
    }

    private static String patientName(Patient patient) {
        String first = patient.getFirstName() != null ? patient.getFirstName().trim() : "";
        String last = patient.getLastName() != null ? patient.getLastName().trim() : "";
        String full = (first + " " + last).trim();
        return full.isBlank() ? "paciente" : full;
    }

    private static String staffDisplayName(Staff staff) {
        User user = staff.getUser();
        if (user != null) {
            String first = user.getFirstName() != null ? user.getFirstName().trim() : "";
            String last = user.getLastName() != null ? user.getLastName().trim() : "";
            String name = (first + " " + last).trim();
            if (!name.isBlank()) {
                return name;
            }
        }
        if (staff.getEmployeeCode() != null && !staff.getEmployeeCode().isBlank()) {
            return staff.getEmployeeCode().trim();
        }
        return "Personal " + staff.getId();
    }
}
