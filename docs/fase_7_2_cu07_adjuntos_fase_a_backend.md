# Fase A — Adjuntos laboratorio (CU07 RN03) — Backend

## Proveedor nube

**Azure Blob Storage** es la opción alineada con **GitHub Student Developer Pack** (Azure for Students / créditos Azure). El backend usa el SDK `azure-storage-blob` cuando `app.storage.type=azure`.

En desarrollo local se usa **disco** (`app.storage.type=local`, carpeta `./data/uploads`).

## Qué se implementó

### Almacenamiento (`com.hospital.storage`)

- `StorageService` — abstracción store/read/delete/exists.
- `LocalStorageService` — perfil por defecto y dev.
- `AzureBlobStorageService` — perfil `prod` (`application-prod.yml`).
- `StorageProperties` — `app.storage.*` en `application.yml`.

### Adjuntos laboratorio

- Metadatos JSON en columna existente `laboratorio.adjunto` (opción A, sin DDL).
- `LaboratoryAttachmentCodec` — serialización/parseo JSON.
- `AttachmentValidationService` — tamaño ≤ 10 MB, PDF/imagen, magic bytes.
- `LaboratoryAttachmentService` — upload, download, metadata, delete.
- Endpoints en `LaboratoryController`:
  - `POST /api/laboratory/{id}/attachment`
  - `GET /api/laboratory/{id}/attachment`
  - `GET /api/laboratory/{id}/attachment/metadata`
  - `DELETE /api/laboratory/{id}/attachment`

### Reglas de negocio

- Un solo archivo por registro; subir nuevo reemplaza el anterior.
- `COMPLETADO` exige adjunto válido (`LaboratoryService`).
- No se puede eliminar adjunto si `estado = COMPLETADO`.
- Campo `attachment` en DTOs create/update **ignorado** (solo vía multipart).

### Respuesta API

`LaboratoryResponse.attachment` pasa de `string` a objeto `LaboratoryAttachmentMetadataResponse` (o `null`).

## Configuración

### Desarrollo (local)

```yaml
app:
  storage:
    type: local
    local:
      base-path: ./data/uploads
```

### Producción (Azure)

Variables de entorno:

- `SPRING_PROFILES_ACTIVE=prod`
- `AZURE_STORAGE_CONNECTION_STRING` — cadena de conexión de la cuenta Storage (Azure Portal → Storage account → Access keys).

`application-prod.yml` activa `app.storage.type=azure`.

Pasos Azure (resumen):

1. Crear **Storage account** (replicación LRS suficiente para proyecto académico).
2. Crear contenedor `hospital-attachments` (o ajustar `app.storage.azure.container-name`).
3. Copiar connection string a variable de entorno del App Service / VM.

## Pendiente (Fase B — frontend)

- [x] Selector de archivo en formulario laboratorio.
- [x] Integración API multipart (`uploadAttachment`, `downloadAttachment`, `deleteAttachment`).
- [x] Bloqueo UI al marcar `COMPLETADO` sin archivo.
- [x] Descarga desde detalle.
- [x] Modelos TypeScript (`attachment` como objeto de metadatos).

## Fuera de alcance

- RN04 notificación al médico.
- Módulo Imágenes (`archivo_resultado`).
- Antivirus.

## Pruebas

- `AttachmentValidationServiceTest`
- `LaboratoryServiceCompletedAttachmentTest`

Comando: `mvn test` desde `backend/`.
