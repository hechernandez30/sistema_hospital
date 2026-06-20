package com.hospital.appointment.mail;

import com.hospital.appointment.entity.Appointment;
import com.hospital.appointment.repository.AppointmentRepository;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class AppointmentEmailNotificationListener {

    private final AppointmentRepository appointmentRepository;
    private final AppointmentNotificationMailService mailService;

    public AppointmentEmailNotificationListener(
            AppointmentRepository appointmentRepository, AppointmentNotificationMailService mailService) {
        this.appointmentRepository = appointmentRepository;
        this.mailService = mailService;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onAppointmentEmailNotification(AppointmentEmailNotificationEvent event) {
        appointmentRepository
                .findByIdWithDetailsForNotification(event.appointmentId())
                .ifPresent(appointment -> mailService.sendIfRequested(appointment, event.kind()));
    }
}
