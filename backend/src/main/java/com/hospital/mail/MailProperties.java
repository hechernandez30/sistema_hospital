package com.hospital.mail;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.mail")
public record MailProperties(boolean enabled, String fromName, String fromAddress) {

    public boolean isOperational() {
        return enabled && fromAddress != null && !fromAddress.isBlank();
    }
}
