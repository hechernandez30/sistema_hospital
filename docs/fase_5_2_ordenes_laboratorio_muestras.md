# Fase 5.2 — Órdenes médicas, muestras (CU06) y laboratorio (CU07)

## Qué se revisó

### Órdenes médicas

- **DTOs**: `MedicalOrderCreateRequest` / `MedicalOrderUpdateRequest` — `medicalCareId` obligatorio; tipos `LABORATORIO|IMAGEN|FARMACIA|HOSPITALIZACION`; estados `PENDIENTE|EN_PROCESO|COMPLETADO|RECHAZADO|PARCIAL|ANULADO`; descripción obligatoria; prioridad opcional en alta (default **NORMAL** en entidad/servicio).
- **`MedicalOrderService`**: resolvía `MedicalCare` por ID (`ResourceNotFoundException` si no existe); validaba tipo y estado contra conjuntos fijos; mensajes de negocio genéricos.
- **Entidad**: FK obligatoria a `MedicalCare` (`id_atencion`); no hay orden sin atención en persistencia.
- **Frontend**: lista con filtro por atención; formulario con selects de tipo/estado y prioridad como texto libre.

### CU06 Muestras médicas

- **No existe módulo/tab separada** de “muestras” en el código analizado.
- La entidad **`Laboratorio`** agrupa: `requesterType` (INTERNO/EXTERNO), `requestType` (MUESTRA_MEDICA/LABORATORIO), `recordNumber`, **`sampleDescription`**, recepción / validez / incidencias — alineado conceptualmente con trámite de muestra **fusionado con el registro de laboratorio**.
- **Adjunto** (`attachment`): columna **TEXT**; no hay almacenamiento de archivos binarios ni carga real de ficheros en esta fase (solo documentado como límite).

### CU07 Laboratorio

- **DTOs**: `LaboratoryCreateRequest` / `LaboratoryUpdateRequest` — validación de patrones para solicitante/solicitud y estado de laboratorio (`PENDIENTE|EN_PROCESO|COMPLETADO|RECHAZADO`).
- **`LaboratoryService`**: exige orden existente; **`orderType == LABORATORIO`**; una sola fila laboratorio por orden (`OneToOne`/unique); texto de error ya existente reforzado.
- **Estados de laboratorio**: distintos del estado de la orden médica (más estados en orden: PARCIAL, ANULADO, etc.).
- **Notificaciones al médico solicitante**: no hay implementación (fuera de alcance).

### Relación con CU12

Cadena esperada operativa:

1. **Atención médica** válida (`MedicalCare`).
2. **Orden médica** con `medicalCareId` y, para laboratorio, `orderType == LABORATORIO`.
3. **Registro laboratorio** con `medicalOrderId` apuntando a esa orden.

## Qué se modificó

### Backend

- **`MedicalOrderService`**:
  - Mensajes **más explícitos** para tipo/estado no válidos y para **404 de atención médica** (orientación a crear/verificar atención primero).
  - **Auditoría** (`BusinessAuditRecorder`, módulo `medical-order`): CREATE / UPDATE / DELETE con snapshot mínimo: `medicalOrderId`, `medicalCareId`, `orderType`, `status`, `priority` (si aplica), `orderDate`.
  - **DELETE**: carga entidad antes de borrar para registrar estado previo.
  - Trim de prioridad en alta/normalización menor en create/update.
- **`LaboratoryService`**:
  - Mensajes **aclarados** (orden ausente / tipo incorrecto / duplicado).
  - **`ensureLaboratoryStatus`** para coherencia de estados además del Bean Validation en DTOs.
  - **Auditoría** (`BusinessAuditRecorder`, módulo `laboratory`): CREATE / UPDATE / DELETE con snapshot mínimo: `laboratoryId`, `medicalOrderId`, `status`, **`requestType`** (equivalente a “tipo muestra/flujo CU06” en modelo actual). Sin resultados clínicos, descripciones largas ni adjuntos.

### Frontend

- **Órdenes médicas**: mapas **`MEDICAL_ORDER_TYPE_LABELS`**, **`MEDICAL_ORDER_STATUS_LABELS`**, etiquetas de **prioridad**; lista con texto legible y **pills** por estado; ordenación lógica de tipo y estado; detalle con código + etiqueta; formulario con **flujo CU12→orden→laboratorio** explicado; prioridad mediante **select** con presets (+ valores legacy en edición); búsqueda en tabla incluye etiquetas traducidas.
- **Laboratorio**: hint de **fusión CU06/CU07**; selects con **etiquetas** para solicitante y tipo solicitud; estados con leyendas en alta; **`sampleDescription` obligatoria solo en alta** (max 8000) sin cambiar backend; lista con **pill** de estado por color y ordenación por flujo de estado; detalle con etiquetas de estado/solicitud; subtítulo de tarjeta alineado al flujo.
- Sin **upload** de archivos ni **notificaciones** nuevas.

## Qué no se modificó y por qué

- **Base de datos**, **URLs**, **nombres de JSON**, **JWT**, **roles**, **CU01**, **farmacia (lógica)**, **pagos**, **reportes**.
- **Contrato backend** para `sampleDescription`: sigue opcional/nullable en API; la **obligatoriedad en creación** se refuerza en **UI** para CU06 sin imponer `@NotBlank` nueva en Java (evita romper integraciones que envían muestra vacía).
- **Carga binaria / adjuntos reales**: el campo permanece texto; tamaño efectivo según BD/TEXT sin validación nueva de longitud masiva.

## Estado final de CU06

| Aspecto | Estado |
|---------|--------|
| Módulo dedicado solo “muestras” | No existe sin DDL nuevo |
| Datos de muestra en modelo | Fusionados en `Laboratorio`: descripción muestra, tipo solicitud, expediente, solicitante |
| Validación muestra obligatoria | Reforzada en **frontend** al **crear** registro |

## Estado final de CU07

| Aspecto | Estado |
|---------|--------|
| Vínculo 1 orden ↔ 1 laboratorio | Mantenido |
| Solo orden `LABORATORIO` | Verificado en servicio (mensajes mejorados) |
| Estados PENDIENTE / EN_PROCESO / COMPLETADO / RECHAZADO | DTO + doble chequeo en servicio |
| Resultado / incidente / adjunto texto | Sin cambios de almacenamiento |
| Notificación al médico | No implementada (pendiente fase posterior) |

## Relación con CU12

Las órdenes **siempre** referencian `medicalCareId` existente (FK + 404 contextualizado). El laboratorio **cuelga de la orden** de tipo LABORATORIO — la atención se alcanza de forma transitiva `(Laboratory → MedicalOrder → MedicalCare)`.

### Órdenes vs módulo de órdenes médicas aparte

El alta de **`MedicalOrder`** sigue desde la API/pantalla de órdenes; **no se añadió** acción nueva cruzada desde atención en esta fase (solo UX y mensajes orientativos).

## Archivos modificados

### Backend

- `backend/src/main/java/com/hospital/medicalorder/service/MedicalOrderService.java`
- `backend/src/main/java/com/hospital/laboratory/service/LaboratoryService.java`

### Frontend

- `frontend/src/app/features/medical-orders/models/medical-order.models.ts`
- `frontend/src/app/features/medical-orders/components/medical-order-form-dialog.component.ts`
- `frontend/src/app/features/medical-orders/components/medical-order-form-dialog.component.html`
- `frontend/src/app/features/medical-orders/components/medical-order-detail-dialog.component.ts`
- `frontend/src/app/features/medical-orders/components/medical-order-detail-dialog.component.html`
- `frontend/src/app/features/medical-orders/components/medical-order-detail-dialog.component.scss`
- `frontend/src/app/features/medical-orders/pages/medical-order-list-page/medical-order-list-page.component.ts`
- `frontend/src/app/features/medical-orders/pages/medical-order-list-page/medical-order-list-page.component.html`
- `frontend/src/app/features/medical-orders/pages/medical-order-list-page/medical-order-list-page.component.scss`
- `frontend/src/app/features/laboratory/models/laboratory.models.ts`
- `frontend/src/app/features/laboratory/components/laboratory-form-dialog.component.ts`
- `frontend/src/app/features/laboratory/components/laboratory-form-dialog.component.html`
- `frontend/src/app/features/laboratory/components/laboratory-detail-dialog.component.ts`
- `frontend/src/app/features/laboratory/components/laboratory-detail-dialog.component.html`
- `frontend/src/app/features/laboratory/pages/laboratory-list-page/laboratory-list-page.component.ts`
- `frontend/src/app/features/laboratory/pages/laboratory-list-page/laboratory-list-page.component.html`
- `frontend/src/app/features/laboratory/pages/laboratory-list-page/laboratory-list-page.component.scss`

### Documentación

- `docs/fase_5_2_ordenes_laboratorio_muestras.md`

## Resultado pruebas backend

- Comando: `mvn clean compile test` desde `backend/`.
- Resultado: **OK** (exit code 0).

## Resultado build frontend

- Comando: `npm run build` desde `frontend/`.
- Resultado: **OK** (exit code 0 — `ng build` sin errores).

## Smoke manual recomendado

1. Crear orden con `medicalCareId` válido y tipo `LABORATORIO` → OK.
2. Orden con atención inexistente → 404 con mensaje orientativo.
3. Crear laboratorio con `medicalOrderId` de orden `LABORATORIO` → OK.
4. Laboratorio con orden `IMAGEN` / `FARMACIA` → 400 regla negocio.
5. Segundo laboratorio para la misma orden → 400 duplicado.
6. Estados laboratorio válidos vs inválido (si se omite violación Bean Validation vs servicio).
7. Auditoría: eventos orden/laboratorio **sin** payloads con descripción diagnóstica/resultados extensos.

## Riesgos pendientes

1. Registros **laboratorio** históricos sin `sampleDescription`: la **creación nueva** ya exige texto en UI; **edición** permite vacío.
2. **`attachment` TEXT**: riesgo de volúmenes grandes o PHI pegada manualmente sin control de tamaño hasta política posterior.
3. **Desync** entre estado de orden (`PARCIAL`, etc.) y estado de laboratorio: no se sincroniza automáticamente (proceso manual/operativo).
4. **CU06 tabla independiente**: seguiría requiriendo DDL y refactor si negocio exige ciclo de vida de muestra desacoplado del estudio.

## Recomendación para Fase 6

- Integrar navegación contextual (desde lista de **atención** o **paciente**) hacia órdenes filtradas y laboratorio sin duplicar APIs.
- Valorar **webhook/cola interna liviana** o bandera “resultado disponible” + listado por médico (sin motor de correo hasta definir infra).
- Políticas de tamaño/longitud para `attachment`/`result` y eventual **storage** objetos (solo con cambio BD/aprobación).

---

## Addendum — Fase 9.3 (mayo 2026)

Ver **`docs/fase_9_3_operacion_clinica_integrada.md`**.

### Órdenes desde atención médica

- Al guardar atención (alta/edición), checkboxes crean órdenes `PENDIENTE` / prioridad `NORMAL` si el tipo no tiene orden activa previa.

### Fulfillment automático al crear orden

- `LABORATORIO` → registro lab pendiente (`ensurePendingRecordForMedicalOrder`).
- `IMAGEN` → registro imagen pendiente (`ensurePendingRecordForMedicalOrder`).

### Correlativo expediente lab (auto-create)

- Formato CU06: `AAAA-MM-DD-CC-NNNNNNN`.
- Backend: `LaboratoryRecordNumberGenerator` (ya no `"Pendiente"` en `recordNumber`).
- CC `LQ` cuando `requestType` es null (caso auto-create desde atención).

### Permisos médico

- GET `/api/medications` permitido a MEDICO y MEDICO-JEFE (formulario orden FARMACIA carga medicamentos bajo demanda).

### Archivos adicionales

- `MedicalOrderService.ensureFulfillmentRecords()`
- `LaboratoryService`, `ImagingStudyService`, `LaboratoryRecordNumberGenerator.java`
- `medical-care-order-request.util.ts`, `medical-order-form-dialog.component.ts`
