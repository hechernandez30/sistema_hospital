# Fase 9 — Escenarios funcionales E2E: roles, estados y cierre del ciclo del paciente

**Fecha:** 2026-05-21  
**Tipo:** Documentación funcional (sin cambios de código)  
**Relacionado con:** `docs/fase_9_pruebas_e2e_cierre_tecnico.md`, Fases 8.1 y 8.2 (baja lógica y política de eliminación)

---

## 1. Introducción

Este documento describe **escenarios funcionales extremo a extremo** del sistema **Hospital H&H**, desde la interacción inicial del visitante con el portal institucional hasta el **cierre administrativo o asistencial** de un episodio de atención, o su **suspensión** por reprogramación, cancelación o anulación.

Para cada etapa se indica:

- **Qué rol** participa y qué acción ejecuta.
- **Qué estado** tiene cada entidad al inicio y al final del paso.
- **Qué condición** habilita avanzar al siguiente paso.
- **Cuándo** el ciclo del paciente se considera finalizado, pendiente o cerrado de forma alternativa.
- **Qué ocurre** si la cita se reprograma o el flujo queda pendiente (pago, órdenes, etc.).

Los estados citados corresponden al **modelo implementado** en backend/frontend (mayo 2026), salvo donde se indique explícitamente una brecha funcional.

---

## 2. Alcance

| Módulo / CU | Incluido en escenarios |
|-------------|------------------------|
| CU01 Portal Web | Consulta informativa, buscador, acceso a login |
| Login / Acceso personal | Autenticación JWT, sesión intranet |
| CU02 Registro de paciente | Alta expediente, consentimiento, `activo` |
| Registro de seguro asociado | Póliza, vigencia, `activo` |
| CU04 Citas | Agenda, solapamiento, cancelación lógica |
| CU11 Admisión | Validación financiera, estados de episodio |
| CU10 Triage | Prioridad, vínculo admisión (emergencia) |
| CU12 Atención médica | Evaluación, diagnóstico, vínculo admisión/cita |
| Órdenes médicas | LABORATORIO, IMAGEN, FARMACIA, HOSPITALIZACION |
| CU06/CU07 Laboratorio | Muestra/resultado, estados operativos y ANULADO |
| Imágenes | Estudio asociado a orden IMAGEN |
| CU13 Farmacia e inventario | Catálogo, stock; despacho contra orden **pendiente** |
| CU09 Pagos y seguros | Cobertura, PAGADO/ANULADO |
| CU08 Reportes | Consulta y export CSV |
| Auditoría / bitácora | Trazabilidad de operaciones críticas |
| CU03 / CU14 (parcial) | Usuarios, roles, personal (contexto de permisos) |

**Fuera de alcance de este documento:** diseño de nuevas pantallas, cambios de API, migraciones SQL o implementación de cierre formal de episodio (solo se recomienda en §5.C).

---

## 3. Roles funcionales involucrados

| Rol | Responsabilidad dentro del flujo | Módulos donde participa (API/UI) |
|-----|----------------------------------|----------------------------------|
| **Usuario visitante / paciente** | Consulta información pública; no muta datos hospitalarios | CU01 Portal (`/p/*`) |
| **Recepcionista** | Registra paciente y seguro; agenda y cancela/reprograma citas; admite; triage en emergencia; anula admisión | Pacientes, seguros, citas, admisiones, triage |
| **Administrador** | Configuración (usuarios, roles, especialidades); acceso amplio; reportes; anulaciones administrativas | Casi todos los módulos según `SecurityConfig` |
| **Médico** | Atención médica; órdenes; consulta pacientes; puede ver lab/imagen según permiso | Atenciones, órdenes, citas (lectura/acción), lab/imagen (parcial) |
| **Enfermería / triage** | Clasificación inicial en urgencias (funcionalmente recepcionista o personal autorizado en triage) | Triage |
| **Técnico de laboratorio** | Registro y seguimiento de solicitudes de laboratorio | Laboratorio |
| **Personal de imágenes / radiología** | Registro de estudios de imagen (rol MEDICO o ADMIN en API actual) | Imágenes |
| **Cajero** | Registro de pagos, cobertura de seguro, anulación de pago | Pagos (lectura paciente GET) |
| **Farmacéutico** | Catálogo e inventario; órdenes tipo FARMACIA (sin despacho automatizado) | Medicamentos, órdenes médicas |
| **RRHH** | Personal y especialidades (catálogos para citas) | Personal, especialidades |
| **Auditor** | Consulta bitácora y reportes | Auditoría, reportes |
| **Sistema informático** | Valida reglas de negocio, unicidad, solapamientos, estados terminales, JWT, auditoría mínima | Transversal |

### Mapeo rol técnico (JWT) → responsabilidad

| Rol en sistema | Ejemplos de acción |
|----------------|-------------------|
| `RECEPCIONISTA` | Paciente, cita, admisión, triage |
| `MEDICO` | Atención, órdenes, lab (con rol LABORATORIO o MEDICO según endpoint) |
| `CAJERO` | Pagos |
| `FARMACIA` | Medicamentos, órdenes FARMACIA |
| `LABORATORIO` | Laboratorio |
| `ADMINISTRADOR` | Todo lo anterior + usuarios, roles, configuración |
| `AUDITOR` | Reportes, audit-logs (solo lectura operativa) |
| `RRHH` | Personal, especialidades |

---

## 4. Escenario principal representativo

### Escenario 1 — Paciente nuevo con cita, seguro activo y pago con cobertura parcial

**Narrativa:** Un paciente nuevo llega al hospital tras consultar el portal. Recepción registra expediente y seguro vigente, agenda cita sin solapamiento, admite con validación por seguro, el médico atiende y genera una orden de laboratorio, el laboratorio completa el estudio, caja cobra con cobertura parcial del seguro y el episodio queda administrativamente resuelto.

**Flujo general:**

```
CU01 Portal → Acceso/Login → CU02 Paciente → Seguro → CU04 Cita → CU11 Admisión
→ CU12 Atención → Orden médica → Laboratorio (opcional) → Imagen/Farmacia (opcional)
→ CU09 Pago → Reportes/Bitácora → Cierre lógico del ciclo
```

#### Tabla detallada por paso

| Paso | Módulo/CU | Rol responsable | Acción realizada | Estado inicial | Estado final esperado | Condición para avanzar | Observaciones |
|------|-----------|-----------------|------------------|----------------|----------------------|------------------------|---------------|
| 1 | CU01 Portal | Visitante / paciente | Consulta inicio, servicios, especialidades, médicos, contacto; usa buscador público | Sin registro en BD hospitalaria | Sin cambio en datos internos | Decide acudir al hospital o contactar por canal institucional | **No** registra pacientes ni reserva citas; contenido desde assets locales |
| 2 | Acceso / Login | Personal autorizado (p. ej. recepcionista) | Inicia sesión en `/p/acceso` → intranet | Sin sesión | Sesión JWT válida; menú según rol | Credenciales válidas; usuario `ACTIVO` (no `DESHABILITADO`) | Rutas intranet bloqueadas sin token (401) |
| 3 | CU02 Paciente | Recepcionista / ADMIN / MEDICO (mutación) | Crea expediente: nombres, DPI/NIT, consentimiento privacidad | Paciente no existe | `pacientes.activo = true` | DPI/NIT único; validaciones OK; aviso privacidad aceptado | Baja lógica posterior: `activo = false` (Fase 8.1), no DELETE físico |
| 4 | Seguro (CU02) | Recepcionista / autorizado mutación paciente | Registra aseguradora, póliza, % cobertura, vigencia | Sin seguro para el paciente | `seguros.activo = true` | Fechas de vigencia coherentes; datos mínimos | CU11 valida seguro **vigente** si `fuente_validacion = SEGURO`; CU09 aplica % en pago |
| 5 | CU04 Cita | Recepcionista / MEDICO / ADMIN | Agenda cita: paciente, médico (personal), fecha/hora | Sin cita | `citas.estado = PROGRAMADA` (default) o `REPROGRAMADA` | Paciente activo; médico sin solapamiento con otras PROGRAMADA/REPROGRAMADA | Estados también: `CANCELADA`, `ATENDIDA`, `NO_ASISTIO` |
| 6 | CU11 Admisión | Recepcionista / ADMIN | Admite paciente; asocia `id_cita` si aplica; valida financiero | Cita PROGRAMADA/REPROGRAMADA (opcional) | `admisiones.estado = ADMITIDO` (default) o `PENDIENTE` | Paciente identificado (DPI, código); `validacion_financiera_ok = true`; fuente `SEGURO` con póliza vigente **o** `PAGO_SITIO` | Si seguro inválido → bloqueo o usar `PAGO_SITIO`. `RECHAZADO` / `ANULADO` cierran flujo asistencial |
| 7 | CU10 Triage (si emergencia) | Recepcionista / enfermería | Registra signos vitales y prioridad (I–IV) | Admisión no RECHAZADA/ANULADA | Triage persistido (sin campo `estado`; prioridad obligatoria) | `admissionId` válido; admisión no cerrada | **No** hay botón eliminar en UI. Opcional en consulta programada |
| 8 | CU12 Atención médica | Médico / ADMIN | Registra motivo, evaluación, diagnóstico, hospitalización si aplica | Admisión ADMITIDO (u otro estado abierto) | Registro de atención creado (sin campo `estado` en entidad) | Admisión no `RECHAZADO`/`ANULADO`; admisión obligatoria; cita opcional PROGRAMADA/REPROGRAMADA | **No** hay botón eliminar en UI |
| 9 | Órdenes médicas | Médico | Crea orden tipo LABORATORIO (ej.) vinculada a atención | Atención registrada | `ordenes_medicas.estado = PENDIENTE` (default) | Tipo válido; paciente de la atención | También: IMAGEN, FARMACIA, HOSPITALIZACION. Anulación: `ANULADO` (8.1) |
| 10 | Laboratorio | Técnico LABORATORIO / MEDICO / ADMIN | Crea registro 1:1 por orden LAB; procesa muestra | Orden LABORATORIO PENDIENTE | `laboratorio.estado`: PENDIENTE → EN_PROCESO → **COMPLETADO** o **RECHAZADO** | Orden no ANULADA; tipo orden = LABORATORIO | **RECHAZADO** = muestra inválida. **ANULADO** = baja administrativa (8.2), no borrado físico |
| 11 | Imágenes (si aplica) | Médico / ADMIN | Registra estudio por orden IMAGEN | Orden IMAGEN PENDIENTE | PENDIENTE → EN_PROCESO → COMPLETADO / RECHAZADO / ANULADO | Una imagen por orden médica | Misma semántica ANULADO vs RECHAZADO que laboratorio |
| 12 | Farmacia (si aplica) | Farmacéutico | Revisa catálogo/stock; orden FARMACIA es texto/contexto | Orden FARMACIA PENDIENTE | Inventario sin cambio automático por orden | — | **Pendiente funcional:** despacho real y descuento stock por orden |
| 13 | CU09 Pago | Cajero / ADMIN | Registra pago; aplica % seguro; método si PAGADO | Sin pago o `PENDIENTE` | `pagos.estado = PAGADO` | Admisión no ANULADA/RECHAZADA; monto coherente; si PAGADO → método EFECTIVO/TARJETA/TRANSFERENCIA | Cobertura 100% → total puede ser 0. Anulación: `ANULADO` (8.1) |
| 14 | Reportes / bitácora | Administrador / Auditor | Genera reportes (citas, admisiones, pagos, lab, stock); consulta auditoría | Operaciones ya persistidas | CSV exportado; eventos en bitácora | Rol ADMINISTRADOR o AUDITOR en reportes | Auditoría: CREATE/UPDATE en bajas lógicas; sin datos clínicos extensos |
| 15 | Cierre del ciclo | Sistema + roles operativos | Verificación de completitud del episodio | Episodio en curso | **Cierre lógico** (ver §5) | Ver condiciones §5.A | No hay botón único «Cerrar episodio» en UI actual |

---

## 5. Cierre del ciclo del paciente

### ¿Cómo se da por finalizado el ciclo del paciente?

#### A. Cierre ideal del ciclo (criterio de negocio)

El ciclo de un **episodio de atención** (vinculado típicamente a una **admisión** y, opcionalmente, una **cita**) se considera **finalizado con éxito** cuando:

1. El **paciente** está registrado y permanece `activo = true` (o se dio de baja solo después del episodio, como archivo).
2. La **cita** asociada, si existió, pasó a `ATENDIDA` (o se documentó `NO_ASISTIO` con política definida).
3. La **admisión** no está `ANULADO` ni `RECHAZADO`, y puede marcarse `ALTA` cuando el paciente egresa del episodio.
4. La **atención médica** del episodio está registrada.
5. Las **órdenes médicas** del episodio están en estado terminal aceptable: `COMPLETADO`, `ANULADO`, `RECHAZADO` o `PARCIAL` documentado — no `PENDIENTE` sin justificación.
6. **Laboratorio / imágenes** vinculados: `COMPLETADO`, `RECHAZADO` o `ANULADO` (no pendientes operativos).
7. El **pago** del episodio está `PAGADO` (o cobertura total 0 con seguro 100% documentado).
8. La **bitácora** refleja las transiciones relevantes (admisión, pago, anulaciones, bajas lógicas).

Si falta alguno de los puntos 5–7, el ciclo permanece **pendiente** aunque la atención médica ya exista.

#### B. Cierre en el sistema actual (estados reales)

| Entidad | ¿Tiene estado de cierre? | Valores relevantes en el sistema |
|---------|--------------------------|--------------------------------|
| **Cita** | Parcial | `PROGRAMADA`, `REPROGRAMADA`, `CANCELADA`, **`ATENDIDA`**, `NO_ASISTIO` — `ATENDIDA` es el cierre natural de la agenda |
| **Admisión** | Parcial | `PENDIENTE`, **`ADMITIDO`**, **`ALTA`**, `TRANSFERIDO`, `RECHAZADO`, **`ANULADO`** — `ALTA` cierra asistencialmente; no existe `CERRADA`/`FINALIZADA` |
| **Atención médica** | No | Sin campo `estado`; la existencia del registro indica atención realizada |
| **Orden médica** | Sí (por orden) | `PENDIENTE`, `EN_PROCESO`, `COMPLETADO`, `RECHAZADO`, `PARCIAL`, **`ANULADO`** |
| **Laboratorio / Imagen** | Sí (por registro) | `PENDIENTE`, `EN_PROCESO`, `COMPLETADO`, `RECHAZADO`, **`ANULADO`** |
| **Pago** | Sí | `PENDIENTE`, **`PAGADO`**, **`ANULADO`** |
| **Paciente** | Maestro | `activo` true/false (no es cierre de episodio) |

**Conclusión:**

> El sistema permite completar atención, órdenes, estudios y pago, pero **no existe todavía un estado único de cierre de episodio/admisión** (por ejemplo `CERRADA` o `FINALIZADA`) que consolide formalmente el final del ciclo del paciente en una sola transición ni una pantalla de «resumen de episodio cerrado».

El cierre operativo actual es **lógico**: el usuario verifica manualmente admisión + atención + órdenes + pago + estados terminales.

**Hallazgo:** Si el pago queda `PENDIENTE`, el backend **no bloquea automáticamente** un «cierre» formal (por no existir); operativamente el ciclo **no debe** considerarse cerrado.

#### C. Recomendación — Fase 9.1 (solo documentación)

**Fase 9.1 — Cierre formal de episodio/admisión** (propuesta, sin implementar):

| Regla propuesta | Descripción |
|-----------------|-------------|
| Estado `CERRADA` o `FINALIZADA` en admisión | Transición explícita desde `ADMITIDO`/`ALTA` |
| Precondiciones | Sin órdenes en `PENDIENTE`/`EN_PROCESO`; sin lab/imagen pendientes; pago `PAGADO` o exención documentada |
| Efecto en cita | Al cerrar, marcar cita vinculada como `ATENDIDA` si aplica |
| Bloqueos | No cerrar si admisión `ANULADO`; no nuevas atenciones/órdenes tras cierre |
| UI | Vista resumen del episodio (paciente, cita, admisión, atenciones, órdenes, pagos) |
| Auditoría | Evento `CLOSE_EPISODE` con ids y estados previos (sin datos clínicos sensibles) |

---

## 6. Flujo alternativo: reprogramación de cita

| Elemento | Detalle |
|----------|---------|
| **Rol** | Recepcionista (o MEDICO/ADMIN con permiso en citas) |
| **Motivo** | Paciente no puede asistir, médico no disponible, decisión administrativa |
| **Acción** | Editar cita: cambiar fecha/hora y/o marcar estado `REPROGRAMADA` |
| **Estado inicial** | `PROGRAMADA` |
| **Estado final** | `REPROGRAMADA` (sigue siendo cita «activa» para solapamiento y vínculo con admisión/atención) |
| **Condición** | Nuevo horario sin solapamiento para el mismo médico; paciente activo |
| **¿Cierra ciclo?** | **No** — el episodio queda **pendiente** hasta admisión + atención + resolución administrativa |
| **Flujo posterior** | CU11 Admisión (en nueva fecha) → CU12 Atención → … → Pago → cierre lógico |

```
CU04 Cita PROGRAMADA
    → Reprogramar (REPROGRAMADA + nueva fecha/hora)
    → [pendiente] Admisión posterior
    → Atención posterior
    → Cierre lógico
```

---

## 7. Flujo alternativo: cita cancelada

| Elemento | Detalle |
|----------|---------|
| **Rol** | Recepcionista |
| **Acción** | «Cancelar cita» en UI (DELETE lógico Fase 8.1) |
| **Estado inicial** | `PROGRAMADA` o `REPROGRAMADA` |
| **Estado final** | `CANCELADA` — **la fila permanece en BD** |
| **Efecto** | El horario del médico queda libre (no cuenta como activa en reglas de solapamiento) |
| **¿Continúa a admisión/atención?** | **No** en la misma cita; hace falta **nueva cita** si el paciente vuelve |
| **Cierre del ciclo** | **Cerrado administrativamente como «cancelado»** — no equivale a atención completada ni a `ATENDIDA` |

---

## 8. Flujo alternativo: admisión anulada

| Elemento | Detalle |
|----------|---------|
| **Rol** | Recepcionista o administrador autorizado |
| **Acción** | «Anular admisión» (DELETE → `estado = ANULADO`, Fase 8.2) |
| **Estado final** | `ANULADO` — **sin borrado físico** |
| **Efectos** | No permite **nuevo** triage, atención médica ni pago sobre esa admisión (`AdmissionStatusRules`) |
| **¿Equivale a atención completada?** | **No** |
| **Cierre del ciclo** | **Cerrado administrativamente como anulado** — distinto de alta médica o pago resuelto |

---

## 9. Flujo alternativo: pago pendiente

| Elemento | Detalle |
|----------|---------|
| **Rol** | Cajero |
| **Estado** | `pagos.estado = PENDIENTE` |
| **Situación** | La atención médica puede estar registrada; órdenes pueden estar completadas |
| **¿Ciclo cerrado?** | **No** desde criterio administrativo (§5.A punto 7) |
| **Hallazgo sistema actual** | No existe transición automática «cerrar episodio» ni bloqueo global por pago pendiente; es responsabilidad operativa verificar caja antes de dar por terminado el episodio |
| **Avance** | Cajero registra pago → `PAGADO` (o `ANULADO` si se revierte cobro) |

---

## 10. Escenarios adicionales resumidos

| # | Escenario | Rol principal | Módulos | Estados clave | Criterio de cierre |
|---|-----------|---------------|---------|---------------|-------------------|
| 2 | Paciente sin seguro, pago en sitio | Recepcionista + Cajero | Paciente, admisión, pago | Admisión con `fuente_validacion = PAGO_SITIO`; pago `PAGADO` | Pago resuelto; admisión no anulada |
| 3 | Seguro vencido o inactivo | Recepcionista | Seguro, admisión | `seguros.activo = false` o fuera de vigencia | Admisión bloqueada con SEGURO; usar PAGO_SITIO o renovar seguro |
| 4 | Emergencia con triage | Recepcionista / enfermería | Admisión EMERGENCIA, triage | Prioridad I–IV; admisión ADMITIDO | Triage registrado; luego atención médica |
| 5 | Solo orden de laboratorio | Médico + Laboratorio | Atención, orden LAB, laboratorio | Lab COMPLETADO o RECHAZADO | Orden/lab en terminal; pago según política |
| 6 | Pago cobertura 100% | Cajero | Pago + seguro | `PAGADO`, total = 0 | Cierre administrativo sin copago |
| 7 | Baja lógica del paciente (post-episodio) | Admin / recepción | Pacientes | `activo = false` | Expediente inactivo; episodios históricos conservados |
| 8 | Usuario deshabilitado | Administrador | Usuarios | `estado = DESHABILITADO` | No afecta ciclo del paciente; bloquea login de ese usuario |
| 9 | Reportes y auditoría | Auditor / Admin | Reportes, bitácora | — | Control ex post; no cierra ciclo clínico |

---

## 11. Diagrama textual del flujo principal con roles

```
[Usuario visitante / Paciente]
    │
    ▼ consulta portal público (CU01) — sin escritura en BD
    │
[Recepcionista] ──login──► Intranet
    │
    ├── registra paciente (activo=true)
    ├── registra seguro (activo=true, vigente)
    ├── agenda cita (PROGRAMADA / REPROGRAMADA)
    └── admite paciente (ADMITIDO + validación SEGURO o PAGO_SITIO)
            │
            ├── [opcional: Enfermería/Recepcionista] triage emergencia
            │
            ▼
[Médico]
    ├── atención médica (registro sin estado)
    └── órdenes médicas (PENDIENTE → …)
            │
            ├── [Técnico laboratorio] laboratorio (→ COMPLETADO / RECHAZADO / ANULADO)
            ├── [Médico/Imágenes] estudio imagen (→ terminal)
            └── [Farmacéutico] inventario / orden FARMACIA (sin despacho auto)
            │
            ▼
[Cajero]
    └── pago (PENDIENTE → PAGADO o ANULADO)
            │
            ▼
[Administrador / Auditor]
    └── reportes + bitácora
            │
            ▼
[Sistema]
    valida reglas, JWT, solapamientos, estados terminales, auditoría mínima
            │
            ▼
Cierre LÓGICO del episodio (§5) — sin estado único CERRADA hoy
```

---

## 12. Matriz final

| Etapa | CU | Rol responsable | Acción | Estado que inicia | Estado que termina | ¿Permite avanzar? | ¿Cierra ciclo? | Observaciones |
|-------|-----|-----------------|--------|-------------------|--------------------|--------------------|----------------|---------------|
| Consulta portal | CU01 | Visitante | Navegar / buscar | — | — | Sí → acudir al hospital | No | Informativo |
| Login | — | Personal | Autenticar | Sin sesión | Sesión activa | Sí → intranet | No | 401 sin token |
| Alta paciente | CU02 | Recepcionista | Crear expediente | No existe | `activo=true` | Sí | No | DPI único |
| Alta seguro | CU02 | Recepcionista | Crear póliza | Sin seguro | `activo=true` | Sí | No | Validado en admisión/pago |
| Cita | CU04 | Recepcionista | Agendar | — | PROGRAMADA | Sí | No | Anti-solapamiento |
| Admisión | CU11 | Recepcionista | Admitir | Cita activa (opt.) | ADMITIDO | Sí → asistencia | No | ANULADO cierra vía alternativa |
| Triage | CU10 | Recepcionista | Clasificar | Admisión abierta | Prioridad registrada | Sí (emergencia) | No | Sin delete UI |
| Atención | CU12 | Médico | Consulta clínica | Admisión abierta | Registro creado | Sí | No | Sin delete UI |
| Orden médica | CU12 | Médico | Prescribir estudio/fármaco | Post-atención | PENDIENTE | Sí (opcional) | No | ANULADO en orden |
| Laboratorio | CU07 | Lab | Procesar | Orden LAB PENDIENTE | COMPLETADO/RECHAZADO/ANULADO | Sí si aplica | Parcial | RECHAZADO ≠ ANULADO |
| Imagen | — | Médico | Estudio | Orden IMAGEN PENDIENTE | Terminal | Sí si aplica | Parcial | |
| Farmacia | CU13 | Farmacia | Inventario | Orden FARMACIA | Sin despacho auto | Parcial | No | Pendiente funcional |
| Pago | CU09 | Cajero | Cobrar | PENDIENTE / nuevo | PAGADO | Sí | **Sí (admin.)** | ANULADO revierte cobro |
| Reportes | CU08 | Admin/Auditor | Consultar | — | — | N/A | No | Solo lectura |
| Cierre lógico | — | Operación | Verificar §5.A | Mixto | Episodio resuelto | — | **Sí (lógico)** | Sin estado CERRADA |

**Leyenda «¿Cierra ciclo?»**

- **Sí (admin.):** pago PAGADO y episodio sin pendientes críticos.
- **Sí (lógico):** cumplimiento global §5.A.
- **Sí (alternativo):** cita CANCELADA o admisión ANULADO — cierra como **no atendido**, no como éxito.
- **No / Parcial:** etapas intermedias.

---

## 13. Restricciones de este entregable

- No se modificó código, base de datos, endpoints, frontend ni backend.
- Solo documentación funcional alineada al sistema en producción de desarrollo (post Fases 8.1 y 8.2).
- Las recomendaciones de Fase 9.1 son propuestas; no constituyen compromiso de implementación.

---

## Referencias

- `docs/fase_9_pruebas_e2e_cierre_tecnico.md` — matriz CU y pruebas técnicas
- `docs/fase_8_1_baja_logica_segura.md` — estados terminales DELETE lógico (8 módulos)
- `docs/fase_8_2_politica_eliminacion_modulos_pendientes.md` — ANULADO, activo roles/especialidades
- `docs/fase_6_2_farmacia_inventario.md` — brecha despacho CU13
- `hospital_postgresql_15_tablas_es.sql` — modelo de datos de referencia
