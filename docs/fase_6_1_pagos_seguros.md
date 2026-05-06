# Fase 6.1 — Pagos y seguros (CU09)

## Qué se revisó

### Pagos (`PaymentService`, DTOs, entidad)

- **Relaciones opcionales**: `admissionId`, `medicalOrderId`; **paciente** obligatorio (`ManyToOne` no opcional).
- **Montos**: `subtotal` ≥ 0; `insurancePercent` 0–100 (capturado en el pago, **no FK a tabla seguros**); `insuranceDiscount` y `totalToPay` calculados en servicio (`subtotal − descuento + copago`; descuento = `subtotal × % ÷ 100`, 2 decimales HALF_UP).
- **`validatePaymentMethodForStatus`**: con estado **PAGADO** obliga método de pago no vacío (compatibilidad EFECTIVO/TARJETA/TRANSFERENCIA vía `@Pattern`).
- **`computeTotal`**: total **≥ 0**; mensaje permite interpretar FA02 (**cobertura 100%, copago 0 ⇒ total 0**).
- **Auditoría (Fase 2 / mantenimiento)**: `BusinessAuditRecorder` ya registraba CREATE/UPDATE/DELETE en módulo `payments`, entidad `Payment`.

### Seguros (`InsuranceService`)

- Gestión REST bajo **`/api/patients/{patientId}/insurances`** (lista, CRUD por paciente).
- Entidad **`Insurance`**: `coveragePercent`, `startDate`, `endDate`, `active`, aseguradora, nº póliza.
- **Auditoría de seguros**: snapshot con **`policyNumberMasked`** (seguridad parcial).
- No existe en repositorio un método **`findUniqueActive`**; las reglas “póliza activa RN07” siguen definidas entre **fecha + flag + negocio** al consumir la lista.

### Frontend pagos previo

- Formulario manual de montos, sin sugerencia de cobertura ni validación cliente de método ante PAGADO; sin vista previa de total.

## Qué se modificó

### Backend (`PaymentService`)

- Mensajes de negocio **más explicativos**:
  - Total negativo: indica la fórmula y menciona caso **total 0,00** con cobertura 100%.
  - Método con **PAGADO**: enumera medios válidos esperados por el modelo.
- **Auditoría de pagos**: `summaryPaymentAudit` ampliada con **solo metadatos** de trazabilidad: `paymentId`, `patientId`, `admissionId` / `medicalOrderId` (si existen), `insurancePercent` (string plano), `status`, `totalToPay`.
  - **Sin** concepto ni nº recibo ni datos de método de pago en bitácora (menor exposición de detalle económico en log).

### Frontend

- **`PatientInsuranceApiService`** + modelo **`PatientInsuranceRow`**: consulta **`GET …/patients/:id/insurances`** sin nuevos endpoints.
- **`coverage-suggestion.util.ts`**: elige cobertura sugerida = **mayor `%` entre pólizas `active` y vigentes a fecha local** (`startDate`/`endDate` opcionales); **`previewPaymentMath`** replica redondeo a 2 decimales del descuento (UX).
- **`payment-form-dialog`**:
  - Textos CU09 / vínculo con **paciente/admisión/orden** y explicación **% manual vs botón “sugerir”**.
  - Defecto **0% seguro** en alta (`insurancePercent: '0'`) sin romper coberturas con seguro cuando el usuario ajusta valores.
  - Validación cliente: método **requerido** si estado **PAGADO** (alineado a backend).
  - Bloqueo preventivo si vista previa indica total **\< 0** antes de llamar API.
  - Leyendas estado/método; **vista previa** descuento/total en pantalla.
- **`payment.models.ts`**: etiquetas legibles de estado/método.
- **`payment-detail-dialog`**: método y estado con etiqueta legible y aclaración de **% capturado en el pago**.

### Seguros backend

- **Sin cambios** de servicio/reglas; uso solo de lista existente para sugerencias en UI.

## Qué no se modificó y por qué

- **Base de datos**, **contratos REST**, **names JSON**, **JWT**, **roles**, **CU01**, **farmacia**, **reportes**.
- No se añadió **FK desde pago a seguro**: el modelo ya guarda solo **porcentaje** en `pagos`; vincular póliza requeriría DDL.
- No se aplicó precarga obligatoria de `%` en backend: evita **ambigüedades** ante varias pólizas o integraciones legacy.
- **`InsuranceService` snapshot** conserva masking de póliza; no se tocó aquí.

## Estado final de CU09

| Elemento | Estado |
| --------- | ------ |
| Pago ligado a paciente | Obligatorio (existente) |
| Opcional admisión / orden | Mantenido; validación de titularidad (existente) |
| Cálculo descuento y total | Sin cambios de fórmula |
| Total negativo | Rechazado (mensaje mejorado); total 0 permitido cuando aplica FA02 |
| PAGADO ⇒ método pag | Backend + UX frontend |
| % seguro | Siempre entrada en pago (0 permitido sin seguro); sugerencia **opcional** desde pólizas |
| Auditoría pagos | Enriquecida con ids y %; sin concepto/recibo PHI extra |

## Relación con CU02 / RN07 / CU11

- **CU02 (pacientes)**: datos de paciente siguen como ancla; seguros cargados por `patientId` en la UX de pago sugerido.
- **RN07 (“póliza activa vigente”)**: interpretación en frontend con `active`, `startDate`, `endDate` y fecha del día; usuario puede sobrescribir el % (**no automatismo definitivo RN**).
- **CU11 admisiones**: relación opcional **`admissionId`** solo documentada/indirecta aquí — sin modificar Admission.

## Archivos modificados

### Backend

- `backend/src/main/java/com/hospital/payment/service/PaymentService.java`

### Frontend

- `frontend/src/app/features/payments/models/payment.models.ts`
- `frontend/src/app/features/payments/models/patient-insurance.models.ts`
- `frontend/src/app/features/payments/services/patient-insurance-api.service.ts`
- `frontend/src/app/features/payments/utils/coverage-suggestion.util.ts`
- `frontend/src/app/features/payments/components/payment-form-dialog.component.ts`
- `frontend/src/app/features/payments/components/payment-form-dialog.component.html`
- `frontend/src/app/features/payments/components/payment-form-dialog.component.scss`
- `frontend/src/app/features/payments/components/payment-detail-dialog.component.ts`
- `frontend/src/app/features/payments/components/payment-detail-dialog.component.html`

### Documentación

- `docs/fase_6_1_pagos_seguros.md`

## Resultado pruebas backend

- Comando: `mvn clean compile test` (directorio `backend/`).
- Resultado: **OK** (exit code 0).

## Resultado build frontend

- Comando: `npm run build` (directorio `frontend/`).
- Resultado: **OK** (exit code 0 — `ng build` sin errores).

## Smoke manual recomendado

1. Pago **sin efecto seguro**: `insurancePercent=0`, método vacío estado PENDIENTE → OK si validaciones restantes cumplen.
2. Pago con **% cobertura** manual (p. ej. 80) → coincide descuento con backend tras guardado.
3. **Cobertura 100%, copayo 0, subtotal N** ⇒ total guardado **0,00**.
4. Combinación que lleve total **−0,01** o menos → rechazo servidor; front bloquea con vista previa + mensaje.
5. Estado **PAGADO** sin método → 400 servidor; bloque cliente con validador.
6. Botón **Sugerir %** con paciente con póliza activa y fechas válidas → relleno sugerido; sin póliza → mensaje aclaratorio.
7. Auditoría: eventos con `patientId`, `paymentId`, `insurancePercent` si aplica, **sin** concepto/recibo nuevos para auditoría.

## Riesgos pendientes

1. **Sin FK pago↔seguro**: conciliación contable/reportes por póliza requiere proceso manual o refactor futuro.
2. **Múltiples pólizas activas**: UX elige mayor `%`; puede no coincidir con la póliza “correcta” clínico-administrativamente.
3. **Roles**: si usuario de pagos no puede llamar **`/api/patients/.../insurances`**, botón solo devolverá error 403 (`getHttpErrorMessage`).
4. **Zona horaria**: vigencia usa **fecha local del navegador** en sugerencias; servidor no valida igual sin endpoint dedicado.

## Recomendación para Fase 6.2

- Valorar **imagenología / farmacia** y coherencia de cobros con orden médica (sin duplicar lógicas de CU05/CU06).
- **Reportes financieros** agregados (totales por estado, método) sin nueva tabla hasta requerimiento formal.
- Si negocio exige vínculo póliza⇒pago, planificar migración DDL + FK opcional **`id_seguro`** con impacto CU09.
