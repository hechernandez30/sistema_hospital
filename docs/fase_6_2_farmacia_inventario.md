# Fase 6.2 — Farmacia e inventario (CU13)

## Qué se revisó

### Backend — medicamentos

- **`MedicationRequest`**: `name`, `presentation`, `unit`, `currentStock`, `minimumStock`, `active`; Jakarta `@NotNull` + `@Min(0)` en stocks (obligatorio y no negativos).
- **`MedicationService`**: CRUD; mapeo a entidad; **`BusinessAuditRecorder`** en CREATE/UPDATE/DELETE con recurso **`medications`**, tipo entidad **`Medication`**.
- **`MedicationController`**: `GET/POST/PUT/DELETE` bajo **`/api/medications`** (sin cambios de rutas ni firmas).
- **`MedicationResponse`**: mismos campos JSON que antes (`id`, `name`, `presentation`, `unit`, `currentStock`, `minimumStock`, `active`).
- **Entidad / SQL**: tabla `hospital.medicamentos` — inventario en la misma fila (`stock_actual`, `stock_minimo`), `CHECK (stock_actual >= 0)` y `CHECK (stock_minimo >= 0)` en el script de referencia.

### Backend — órdenes médicas y farmacia

- **`MedicalOrder`**: `tipo_orden` (`FARMACIA` permitido), `descripcion`, `prioridad`, `estado`, sin FK a **`id_medicamento`** ni tabla de líneas.
- **`MedicalOrderService`**: validación de tipo y estado; orden ligada solo a **`MedicalCare`**; **no existe** modelo de líneas de medicamento ni cantidades.
- **Brecha despacho**: la orden tipo **FARMACIA** es un registro de texto/contexto (`descripcion`), no un vínculo estructurado al catálogo ni a cantidades solicitadas o entregadas.

### Frontend — medicamentos

- Lista, formulario crear/editar, detalle (`medication-list-page`, `medication-form-dialog`, `medication-detail-dialog`).
- Validación cliente entera ≥ 0 para stocks (`nonNegativeIntRequired`).
- **No hay** pantalla ni flujo de “despacho” ni integración con órdenes FARMACIA.

## Qué se modificó

### Backend

- **`MedicationRequest`**: mensajes **`@Min`** más explícitos (“no puede ser negativo”).
- **`MedicationService`**:
  - Comprobación defensiva en **`map`**: **`BusinessRuleException`** si algún stock &lt; 0 (convive con Jakarta; no cambia contratos REST).
  - **`summaryMedicationAudit`**: añade **`presentation`** y **`unit`** (si vienen informados), **`minimumStock`**, y flag calculado **`lowStock`** (= `currentStock <= minimumStock`). No son campos del DTO público JSON de medicamentos.

### Frontend

- **Lista**: método **`lowStock(row)`**; resaltado y tooltip cuando **`currentStock <= minimumStock`**; icono opcional visible en celda de stock.
- **Detalle**: banda de aviso cuando condición de stock bajo se cumple.
- **Formulario**: **`mat-hint`** en stocks (reabasto / umbral de alerta); texto de apoyo sobre **activo/inactivo** y limitación actual del despacho vinculado a órdenes.

### Documentación CU13

- Esta ficha y la sección “Brechas” más abajo dejan CU13 como **cumplimiento parcial** respecto al despacho real.

## Qué no se modificó y por qué

- **Base de datos**: sin DDL nuevas ni alteraciones (restricción explícita del alcance).
- **Endpoints REST** y **nombres de campos** en **`MedicationRequest` / `MedicationResponse`**.
- **JWT**, **roles**, **seguridad**, **CU01**, **pagos**, **laboratorio**, **reportes**.
- **`MedicalOrderService`**: las órdenes FARMACIA siguen igual; **no** se implementó despacho ni descuento de inventario automático desde órdenes (sin estructura de líneas ni movimientos).
- **Sin nuevos estados** de orden ni de inventario.

## Estado final de CU13 (Farmacia e inventario)

| Aspecto | Estado |
| -------- | ------ |
| Catálogo de medicamentos CRUD | Operativo |
| Stock actual / mínimo en API y pantallas | Mantenido; mensajes y reglas más claros |
| Stock negativo en API | Rechazo vía **`@Min(0)`** + capa servicio |
| Alerta visual stock bajo (`currentStock <= minimumStock`) | Implementada en listado y detalle |
| Ajuste manual de inventario | Edición del **stock actual** en formulario existente (sin nuevo endpoint) |
| Auditoría de medicamentos | Existente; payload de negocio enriquecido (ver arriba) |
| Despacho real frente a orden FARMACIA | **No implementado** (parcial hasta Fase siguiente con modelo) |

## Brechas para despacho real

Para llegar a un CU13 con **despacho trazable** haría falta (no creado en esta fase):

1. **Entidad de despacho** (o episodio de farmacia) vinculada a contexto del paciente/atención.
2. **Líneas de despacho**: **`id_medicamento`**, **cantidad solicitada**, **cantidad entregada** (ajustable en entregas parciales).
3. **Vínculo con orden médica** (`id_orden` tipo FARMACIA o equivalente normativo).
4. **Movimientos de inventario** (o política única sobre `medicamentos.stock_actual` con registros históricos) para auditoría contable/física sin inconsistencias concurrentes.

Hoy la orden **`FARMACIA`** solo aporta **tipo + descripción + estado** sin FK a **`medicamentos`**, por tanto **no** es seguro **descontar stock** desde la orden sin ampliar el modelo.

## Archivos modificados

### Backend

- `backend/src/main/java/com/hospital/medication/dto/MedicationRequest.java`
- `backend/src/main/java/com/hospital/medication/service/MedicationService.java`

### Frontend

- `frontend/src/app/features/medications/pages/medication-list-page/medication-list-page.component.ts`
- `frontend/src/app/features/medications/pages/medication-list-page/medication-list-page.component.html`
- `frontend/src/app/features/medications/pages/medication-list-page/medication-list-page.component.scss`
- `frontend/src/app/features/medications/components/medication-detail-dialog.component.html`
- `frontend/src/app/features/medications/components/medication-detail-dialog.component.scss`
- `frontend/src/app/features/medications/components/medication-form-dialog.component.html`
- `frontend/src/app/features/medications/components/medication-form-dialog.component.scss`

### Documentación

- `docs/fase_6_2_farmacia_inventario.md` (este archivo)

## Pruebas obligatorias

### Backend — `mvn clean compile test`

- **Resultado**: ejecución completada correctamente (**exit code 0**), 2026-05-06, Java 17, perfil de tests activo.

### Frontend — `npm run build`

- **Resultado**: **`ng build`** correcto (**exit code 0**), salida bajo `frontend/dist/hospital-web`.

### Smoke (manual / documentado)

| Caso | Cómo comprobar |
|------|-----------------|
| Crear medicamento válido | Alta con stocks ≥ 0; guardado correcto |
| Rechazar stock negativo | Formulario cliente; API con valores &lt; 0 → validación Jakarta o `BusinessRuleException` |
| Editar medicamento | PUT existente; reabasto subiendo **`currentStock`** |
| Stock bajo | `currentStock <= minimumStock` → listado resaltado, detalle con banda |
| Auditoría | Eventos **`medications` / Medication`** con snapshot enriquecido (`minimumStock`, `lowStock`, etc.) |

## Riesgos pendientes

- **Inventario compartido sin movimientos**: el ajuste manual no deja línea temporal de auditoría diferenciada de un “reabasto” vs “corrección” (solo bitácora de negocio al guardar CRUD).
- **Órdenes FARMACIA sin catálogo**: riesgo operativo si se interpreta **`descripcion`** como prescripción única fuente de verdad.
- **Auditoría interna**: consumidores del JSON deben tolerar nuevas claves opcionales en el payload de **`BusinessAuditRecorder`** (**`presentation`**, **`unit`**, **`minimumStock`**, **`lowStock`**).

## Recomendación para Fase 7

Diseñar un **incremento DDL acordado** con:

- Tabla de **líneas de farmacia/despacho** (medicamento + cantidades + estado por línea o por cabecera),
- FK explícitas a **`ordenes_medicas`** donde aplique,
- Reglas **transaccionales**: entrega ⇒ actualización **`stock_actual`** y registro **histórico** (o tabla de movimientos),
- Coordinación opcional con **pagos**/cobros si CU lo exige,
- Tests de integración cobr despacho parcial/completo.

Hasta entonces mantener CU13 como **gestión de catálogo + inventario simple + alertas UI**, sin despacho automatizado desde órdenes.
