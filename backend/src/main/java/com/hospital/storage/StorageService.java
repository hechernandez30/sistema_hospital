package com.hospital.storage;

import java.io.InputStream;

/**
 * Abstracción de almacenamiento de objetos (disco local en dev, Azure Blob en nube).
 */
public interface StorageService {

    void store(String storageKey, InputStream content, long sizeBytes, String contentType);

    InputStream read(String storageKey);

    void delete(String storageKey);

    boolean exists(String storageKey);
}
