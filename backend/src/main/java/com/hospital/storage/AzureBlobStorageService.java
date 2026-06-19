package com.hospital.storage;

import com.azure.storage.blob.BlobClient;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.BlobServiceClient;
import com.azure.storage.blob.BlobServiceClientBuilder;
import com.hospital.exception.BusinessRuleException;
import jakarta.annotation.PostConstruct;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.InputStream;

/**
 * Azure Blob Storage — recomendado para nube con créditos Azure for Students (GitHub Student Pack).
 */
@Service
@ConditionalOnProperty(name = "app.storage.type", havingValue = "azure")
public class AzureBlobStorageService implements StorageService {

    private final BlobContainerClient containerClient;

    public AzureBlobStorageService(StorageProperties properties) {
        String connectionString = properties.getAzure().getConnectionString();
        if (connectionString == null || connectionString.isBlank()) {
            throw new IllegalStateException(
                    "app.storage.azure.connection-string es obligatorio cuando app.storage.type=azure");
        }
        BlobServiceClient serviceClient = new BlobServiceClientBuilder()
                .connectionString(connectionString.trim())
                .buildClient();
        this.containerClient = serviceClient.getBlobContainerClient(properties.getAzure().getContainerName());
    }

    @PostConstruct
    void ensureContainer() {
        containerClient.createIfNotExists();
    }

    @Override
    public void store(String storageKey, InputStream content, long sizeBytes, String contentType) {
        BlobClient blob = containerClient.getBlobClient(storageKey);
        try {
            byte[] bytes = content.readAllBytes();
            blob.upload(new ByteArrayInputStream(bytes), bytes.length, true);
            if (contentType != null && !contentType.isBlank()) {
                blob.setHttpHeaders(new com.azure.storage.blob.models.BlobHttpHeaders().setContentType(contentType));
            }
        } catch (Exception e) {
            throw new BusinessRuleException("No se pudo guardar el archivo adjunto en Azure Blob Storage.");
        }
    }

    @Override
    public InputStream read(String storageKey) {
        BlobClient blob = containerClient.getBlobClient(storageKey);
        if (!blob.exists()) {
            throw new BusinessRuleException("No se encontró el archivo adjunto en almacenamiento.");
        }
        try {
            return blob.openInputStream();
        } catch (Exception e) {
            throw new BusinessRuleException("No se pudo leer el archivo adjunto.");
        }
    }

    @Override
    public void delete(String storageKey) {
        try {
            containerClient.getBlobClient(storageKey).deleteIfExists();
        } catch (Exception e) {
            throw new BusinessRuleException("No se pudo eliminar el archivo adjunto del almacenamiento.");
        }
    }

    @Override
    public boolean exists(String storageKey) {
        return containerClient.getBlobClient(storageKey).exists();
    }
}
