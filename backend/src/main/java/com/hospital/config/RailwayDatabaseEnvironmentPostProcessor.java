package com.hospital.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * Convierte {@code DATABASE_URL} de Railway ({@code postgres://...}) a propiedades JDBC de Spring.
 */
public class RailwayDatabaseEnvironmentPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        if (!isRailwayProfile(environment)) {
            return;
        }
        String databaseUrl = environment.getProperty("DATABASE_URL");
        if (databaseUrl == null || databaseUrl.isBlank()) {
            return;
        }
        try {
            URI uri = URI.create(databaseUrl.replace("postgres://", "postgresql://"));
            String userInfo = uri.getUserInfo();
            String username = "";
            String password = "";
            if (userInfo != null && !userInfo.isBlank()) {
                String[] parts = userInfo.split(":", 2);
                username = decode(parts[0]);
                if (parts.length > 1) {
                    password = decode(parts[1]);
                }
            }
            String host = uri.getHost();
            int port = uri.getPort() > 0 ? uri.getPort() : 5432;
            String path = uri.getPath();
            String database = path != null && path.length() > 1 ? path.substring(1) : "railway";

            Map<String, Object> props = new HashMap<>();
            props.put(
                    "spring.datasource.url",
                    "jdbc:postgresql://" + host + ":" + port + "/" + database + "?sslmode=prefer");
            props.put("spring.datasource.username", username);
            props.put("spring.datasource.password", password);
            environment.getPropertySources().addFirst(new MapPropertySource("railwayDatabaseUrl", props));
        } catch (RuntimeException ignored) {
            // PGHOST/PGPORT en application-railway.yml
        }
    }

    private static boolean isRailwayProfile(ConfigurableEnvironment environment) {
        if (environment.matchesProfiles("railway")) {
            return true;
        }
        String active = environment.getProperty("SPRING_PROFILES_ACTIVE", "");
        return active.contains("railway");
    }

    private static String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }
}
