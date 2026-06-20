package com.hospital.appointment.mail;

public record AppointmentEmailNotificationEvent(Long appointmentId, Kind kind) {

    public enum Kind {
        CREATED,
        UPDATED,
        CANCELLED
    }
}
