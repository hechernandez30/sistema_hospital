package com.hospital.storage;

import com.hospital.exception.BusinessRuleException;
import jakarta.annotation.PostConstruct;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

@Service
@ConditionalOnProperty(name = "app.storage.type", havingValue = "local", matchIfMissing = true)
@ConditionalOnMissingBean(StorageService.class)
public class LocalStorageService implements StorageService {

    private final Path basePath;

    public LocalStorageService(StorageProperties properties) {
        this.basePath = Path.of(properties.getLocal().getBasePath()).toAbsolutePath().normalize();
    }

    @PostConstruct
    void ensureBaseDirectory() {
        try {
            Files.createDirectories(basePath);
        } catch (IOException e) {
            throw new IllegalStateException("No se pudo crear el directorio de almacenamiento: " + basePath, e);
        }
    }

    @Override
    public void store(String storageKey, InputStream content, long sizeBytes, String contentType) {
        Path target = resolve(storageKey);
        try {
            Files.createDirectories(target.getParent());
            Files.copy(content, target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new BusinessRuleException("No se pudo guardar el archivo adjunto.");
        }
    }

    @Override
    public InputStream read(String storageKey) {
        Path target = resolve(storageKey);
        if (!Files.isRegularFile(target)) {
            throw new BusinessRuleException("No se encontró el archivo adjunto en almacenamiento.");
        }
        try {
            return Files.newInputStream(target);
        } catch (IOException e) {
            throw new BusinessRuleException("No se pudo leer el archivo adjunto.");
        }
    }

    @Override
    public void delete(String storageKey) {
        Path target = resolve(storageKey);
        try {
            Files.deleteIfExists(target);
        } catch (IOException e) {
            throw new BusinessRuleException("No se pudo eliminar el archivo adjunto del almacenamiento.");
        }
    }

    @Override
    public boolean exists(String storageKey) {
        return Files.isRegularFile(resolve(storageKey));
    }

    private Path resolve(String storageKey) {
        Path resolved = basePath.resolve(storageKey).normalize();
        if (!resolved.startsWith(basePath)) {
            throw new BusinessRuleException("Clave de almacenamiento no válida.");
        }
        return resolved;
    }
}
