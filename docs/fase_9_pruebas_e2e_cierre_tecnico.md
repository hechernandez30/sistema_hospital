# Fase 9 — Pruebas funcionales E2E y cierre técnico

**Fecha:** 2026-05-21  
**Estado:** Cierre técnico documentado  
**Prerequisitos validados:** Fase 8.1 (baja lógica segura, UAT) · Fase 8.2 (política de eliminación, UAT)

---

## 1. Resumen ejecutivo

La Fase 9 consolida la **validación extremo a extremo** del sistema Hospital H&H sin introducir funcionalidades nuevas. Se ejecutaron las pruebas técnicas obligatorias (`mvn clean compile test`, `npm run build`) y se revisó el código y la documentación de fases anteriores frente al flujo principal hospitalario y la matriz de casos de uso (CU01–CU14).

**Resultado global:**

| Ámbito | Resultado |
|--------|-----------|
| Compilación y tests automatizados | **OK** |
| Baja lógica Fase 8.1 | **OK** (UAT confirmado) |
| Política eliminación Fase 8.2 | **OK** (UAT confirmado) |
| Flujo asistencial completo (CU01–CU14) | **Parcial** (implementado; brechas funcionales conocidas y aceptadas) |
| Cierre técnico del repositorio | **Listo** |

No se detectaron defectos **bloqueantes** de compilación, build ni navegación estructural. Los pendientes restantes son de **alcance funcional** ya documentados (despacho farmacia CU13, refuerzos CU10/CU05), no regresiones de las fases 8.1/8.2.

**Recomendación final:** el proyecto está **listo para cierre técnico** del entregable actual, con **fase correctiva menor opcional** solo si el negocio exige cerrar brechas CU13 (despacho) o CU10 (FA01 vitales/paro) antes de producción.

---

## 2. Ambiente usado

| Elemento | Valor |
|----------|--------|
| SO | Windows 10 (10.0.26200) |
| Backend | Java 17, Spring Boot 3.4.4, Maven |
| Frontend | Angular 19, `ng build` producción |
| Base de datos | PostgreSQL, esquema `hospital` (referencia `hospital_postgresql_15_tablas_es.sql`) |
| Seguridad | JWT stateless, roles por endpoint (`SecurityConfig`) |
| Repositorio | `sistema_hospital` |
| Fecha ejecución pruebas técnicas Fase 9 | 2026-05-21 |

---

## 3. Datos de prueba usados o sugeridos

### Heredados de UAT Fases 8.1 / 8.2

- Registros desactivados/anulados verificados en BD (`activo=false`, `estado=ANULADO`).
- Admisión anulada para probar bloqueo de triage, atención y pago.

### Sugeridos para recorrido E2E integral (si se repite UAT formal)

| Dato | Uso |
|------|-----|
| Paciente nuevo | DPI/NIT únicos, aviso de privacidad CU02 |
| Seguro activo | Vigencia actual, `activo=true` |
| Cita | Mismo médico en horario solapado vs médico distinto |
| Admisión | `SEGURO` o `PAGO_SITIO`; caso `RECHAZADO` vs `ANULADO` |
| Usuario `ADMINISTRADOR` | Reportes, usuarios, roles |
| Usuario `AUDITOR` | Reportes y bitácora |
| Usuario sin rol (p. ej. solo lectura) | Prueba 403 |
| Sin token / token inválido | Prueba 401 |
| Medicamento | `stock_actual <= stock_minimo` para alerta y reporte |
| Orden `LABORATORIO` / `IMAGEN` / `FARMACIA` | Cadena atención → orden → lab/imagen |
| Pago | Sin seguro, con % cobertura, cobertura 100% → total 0 |

---

## 4. Flujo principal validado

Leyenda por paso: **OK** = implementado y coherente con reglas (UAT previo y/o revisión código); **Parcial** = implementado con brechas documentadas o sin re-ejecución manual completa en esta fase; **No probado** = no aplicable o sin módulo.

| # | Flujo | Estado | Notas |
|---|--------|--------|-------|
| 1 | Portal público CU01 | **OK** | Rutas `/p/*`, buscador local, sin registro/reserva pública (Fase 7.2) |
| 2 | Login e intranet | **Parcial** | JWT + guards; menú por rol; UAT sesión manual recomendada por rol |
| 3 | Paciente y seguro CU02 | **Parcial** | CRUD + validaciones; baja lógica paciente/seguro OK (8.1) |
| 4 | Cita CU04 | **Parcial** | Solapamiento mismo médico en `AppointmentService`; cancelación lógica OK (8.1) |
| 5 | Admisión CU11 | **Parcial** | Validación financiera; anulación OK (8.2); flujo completo en fases 4.x |
| 6 | Triage CU10 | **Parcial** | Sin botón eliminar (8.2); bloqueo admisión anulada; FA01/vitales obligatorios pendientes |
| 7 | Atención médica CU12 | **Parcial** | Sin botón eliminar (8.2); vínculo admisión; bloqueo admisión cerrada |
| 8 | Órdenes médicas | **Parcial** | Tipos LAB/IMAGEN/FARMACIA/HOSP; anulación orden OK (8.1) |
| 9 | Laboratorio | **OK** (8.2) / **Parcial** (CU) | Anulación sin DELETE físico; RECHAZADO operativo; flujo muestra integrado en lab |
| 10 | Imágenes | **OK** (8.2) / **Parcial** (CU) | Anulación sin DELETE físico; orden médica preservada |
| 11 | Farmacia CU13 | **Parcial** | CRUD medicamento, stock, alerta bajo, desactivar OK (8.1); **sin despacho por orden** |
| 12 | Pagos CU09 | **Parcial** | Cobertura seguro, anulación OK (8.1); UAT montos recomendado |
| 13 | Reportes CU08 | **Parcial** | 5 reportes + CSV; rol ADMINISTRADOR/AUDITOR en API |
| 14 | Auditoría / bitácora | **Parcial** | `BusinessAuditRecorder` en módulos críticos; payloads mínimos |
| 15 | Seguridad | **Parcial** | 401/403 configurados; pruebas manuales por rol recomendadas |

---

## 5. Matriz CU vs resultado

| CU | Nombre | Resultado | Evidencia resumida |
|----|--------|-----------|-------------------|
| CU01 | Portal Web | **OK** | `public.routes.ts`, buscador en layout, assets locales, `/p/acceso` → login; sin API pública de datos clínicos |
| CU02 | Registro Paciente | **Parcial** | API/UI pacientes, DPI único, seguros por paciente, aviso privacidad; baja lógica UAT 8.1 |
| CU03 | Usuarios | **Parcial** | CRUD usuarios, roles, deshabilitar usuario (8.1); solo ADMIN en API |
| CU04 | Citas | **Parcial** | CRUD, anti-solapamiento médico, cancelación lógica (8.1) |
| CU05 | Reglas transversales | **Parcial** | Validaciones Jakarta, excepciones negocio, auditoría parcial por módulo |
| CU06 | Muestras | **Parcial** | Modelo fusionado en `laboratorio` (muestra/resultado en misma entidad) |
| CU07 | Laboratorio | **Parcial** | CRUD lab por orden LABORATORIO; estados incl. RECHAZADO/ANULADO; anulación UAT 8.2 |
| CU08 | Reportes | **Parcial** | `/api/reports/**` + UI CSV; citas, admisiones, pagos, lab, stock bajo |
| CU09 | Pagos | **Parcial** | Pagos con admisión/orden; anulación (8.1); seguro en paciente |
| CU10 | Triage | **Parcial** | CRUD por admisión; prioridades; sin delete UI (8.2); pendientes FA01 documentados |
| CU11 | Admisión | **Parcial** | Tipos ingreso, validación SEGURO/PAGO_SITIO; anulación (8.2) |
| CU12 | Atención médica | **Parcial** | CRUD con admisión/cita; órdenes desde atención; sin delete UI (8.2) |
| CU13 | Farmacia | **Parcial** | Inventario en medicamentos; órdenes FARMACIA sin despacho ni movimientos |
| CU14 | Horarios/asistencia | **Parcial** | Campos `horario` y `asistencia` en `personal`; sin módulo de turnos avanzado |

---

## 6. Resultado por escenario obligatorio (detalle)

### 1. Portal público CU01 — **OK**

- Inicio, Servicios, Especialidades, Médicos, Contacto: rutas lazy en `public.routes.ts`.
- Buscador: servicio/especialidad/médico sobre JSON local; panel sin resultados.
- Sin registro público ni reserva: no hay rutas ni formularios de alta/cita en `/p`.
- Acceso personal → `/p/acceso` (login intranet).

### 2. Login e intranet — **Parcial**

- Login JWT documentado en Fase 2.
- `SecurityConfig` + guards Angular en intranet.
- Pendiente: matriz manual 401/403 por cada rol en cada módulo.

### 3. Paciente y seguro CU02 — **Parcial**

- Validaciones backend (`PatientCreateRequest`, unicidad DPI).
- Seguros activos por paciente; desactivar seguro (8.1).
- Listado paciente con `includeInactive`.

### 4. Cita CU04 — **Parcial**

- Regla explícita: no solapamiento PROGRAMADA/REPROGRAMADA mismo médico.
- Horario con otro médico permitido si no hay conflicto.
- Estado inicial y cancelación lógica (8.1).

### 5. Admisión CU11 — **Parcial**

- `ensureFinancialValidation` excepto RECHAZADO/ANULADO.
- Anulación: `estado=ANULADO`, fila en BD (8.2 UAT).
- Admisión activa (`ADMITIDO`, etc.) habilita flujos posteriores.

### 6. Triage CU10 — **Parcial**

- Emergencia → triage con prioridad.
- **Sin botón eliminar** en UI (8.2 UAT).
- `AdmissionStatusRules`: admisión ANULADA/RECHAZADA bloquea create/update triage.

### 7. Atención médica CU12 — **Parcial**

- Create con admisión válida; campos mínimos en DTOs.
- **Sin botón eliminar** (8.2 UAT).
- Bloqueo admisión cerrada en `MedicalCareService`.

### 8. Órdenes médicas — **Parcial**

- Desde atención: LABORATORIO, IMAGEN, FARMACIA, HOSPITALIZACION.
- Orden **ANULADA** no debe tratarse como activa (estado terminal, 8.1).

### 9. Laboratorio — **OK** (política 8.2) / **Parcial** (CU completo)

- Registro por orden LABORATORIO; estados EN_PROCESO, COMPLETADO, RECHAZADO.
- **Anular** → ANULADO, sin DELETE físico (8.2 UAT).
- **RECHAZADO** ≠ baja lógica (muestra rechazada).

### 10. Imágenes — **OK** (política 8.2) / **Parcial** (CU completo)

- Módulo `/api/imaging` + UI listado/formulario.
- Anulación ANULADO sin borrar orden (8.2 UAT).

### 11. Farmacia e inventario CU13 — **Parcial**

- Medicamento: stock, mínimo, alerta UI y reporte stock bajo.
- Desactivar medicamento (8.1): no DELETE físico.
- **Pendiente real:** despacho contra orden FARMACIA, descuento stock, movimientos (ver `docs/fase_6_2_farmacia_inventario.md`).

### 12. Pagos y seguros CU09 — **Parcial**

- Pago con/sin seguro; reglas de cobertura en `PaymentService`.
- Anular pago → ANULADO en BD (8.1 UAT).
- Historial visible en listado.

### 13. Reportes CU08 — **Parcial**

- Reportes: citas, admisiones, pagos, laboratorio, stock bajo.
- Export CSV en `reports-page.component.ts`.
- API: `hasAnyRole("ADMINISTRADOR", "AUDITOR")`.

### 14. Auditoría / bitácora — **Parcial**

- `BusinessAuditRecorder` en pacientes, admisiones, pagos, roles, lab, imaging, etc.
- Bajas lógicas registran **UPDATE** con `active`/`status` (no DELETE en auditoría de negocio).
- Snapshots sin observaciones clínicas extensas en admisiones/triage.

### 15. Seguridad — **Parcial**

- Sin token → 401 (`RestAuthenticationEntryPoint`).
- Rol incorrecto → 403 (`RestAccessDeniedHandler`).
- Portal `/p/**` y endpoints públicos matcher sin JWT.
- Intranet requiere login.

---

## 7. Hallazgos

### Bloqueantes

- **Ninguno** en compilación, tests unitarios/WebMvc existentes ni build frontend.

### No bloqueantes

1. Warning presupuesto CSS `public-layout.component.scss` (~4.29 kB vs 4 kB) — no impide build.
2. Suite automatizada **no cubre** E2E UI ni matriz 401/403 por rol (solo smoke WebMvc parcial).
3. `docs/fase_8_pruebas_e2e_funcionales.md` (2026-05-06) queda **supersedido** en alcance por este documento Fase 9.

### Confirmaciones explícitas (Fases 8.1 / 8.2 — UAT ya ejecutado)

| Tema | Estado |
|------|--------|
| Usuarios, pacientes, personal, seguros, medicamentos, citas, pagos, órdenes: baja lógica | **OK** |
| Roles, especialidades: desactivar (`activo=false`) | **OK** |
| Admisiones, laboratorio, imágenes: `ANULADO`, sin DELETE físico | **OK** |
| `RECHAZADO` no usado como baja lógica en adm/lab/img | **OK** |
| Triage y atenciones: sin botón eliminar en UI | **OK** |
| Textos UI Desactivar / Anular | **OK** |

---

## 8. Pendientes funcionales reales

| ID | Pendiente | CU | Impacto entrega |
|----|-----------|-----|-----------------|
| P1 | Despacho farmacia vinculado a orden FARMACIA + movimientos inventario | CU13 | Medio — operación farmacia incompleta |
| P2 | Flag/campo paro cardiorrespiratorio y vitales obligatorios según política clínica | CU10 | Bajo–medio — según normativa interna |
| P3 | Suite automatizada 401/403 por rol y endpoint | Seguridad | Bajo — hardening |
| P4 | UAT manual formal con evidencia (capturas) del flujo 1–15 en una sola sesión | Todos | Bajo — documentación operativa |
| P5 | Política DELETE API para triage/atención (deshabilitar o restringir rol) | CU10/CU12 | Bajo — UI ya protegida |

---

## 9. Riesgos para entrega

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| Uso operativo de farmacia sin despacho | Media | Documentar procedimiento manual externo hasta CU13 completo |
| DELETE API triage/atención accesible fuera de UI | Baja | Restringir en Fase 8.3 o WAF interno |
| Brecha entre “cierre técnico” y “aceptación clínica” | Media | Checklist UAT P4 antes de go-live |
| Migración 8.2 no aplicada en un entorno | Alta (ese entorno) | Ejecutar `migrate-fase-8-2-estados.sql` |

---

## 10. Confirmación baja lógica 8.1 y 8.2

Referencia: `docs/fase_8_1_baja_logica_segura.md`, `docs/fase_8_2_politica_eliminacion_modulos_pendientes.md` (sección Validación UAT manual).

| Fase | Alcance | Confirmación Fase 9 |
|------|---------|---------------------|
| 8.1 | 8 módulos transaccionales/maestros con estado/activo | **Mantiene OK** — sin regresión en código ni reactivación de `repository.delete` en esos servicios |
| 8.2 | Roles, especialidades, admisiones, lab, imágenes; UI triage/atenciones | **Mantiene OK** — `@PreRemove`, anulación, validaciones `AdmissionStatusRules` presentes en código |

---

## 11. Resultado `mvn clean compile test`

| Campo | Valor |
|-------|--------|
| Comando | `mvn clean compile test` |
| Fecha | 2026-05-21 |
| Resultado | **OK** (exit code 0) |
| Observación | WebMvc tests (audit, patient, payment, role, etc.) sin fallos |

---

## 12. Resultado `npm run build`

| Campo | Valor |
|-------|--------|
| Comando | `npm run build` |
| Fecha | 2026-05-21 |
| Resultado | **OK** (exit code 0) |
| Salida | `frontend/dist/hospital-web` |
| Observación | Warning no bloqueante: budget SCSS `public-layout.component.scss` (+294 B) |

---

## 13. Recomendación final

### Listo para cierre técnico

El repositorio **compila**, **pasa tests** existentes, **genera build** de producción y cumple el flujo hospitalario **principal** con las excepciones documentadas (CU13 despacho, refuerzos CU10/CU05). Las fases 8.1 y 8.2 permanecen **estables** tras UAT.

### Fase correctiva menor (opcional, no bloqueante)

Abrir solo si el negocio lo exige antes de producción:

1. **CU13:** despacho mínimo (líneas orden–medicamento + descuento stock).
2. **Seguridad:** tests automatizados 401/403.
3. **CU10:** campos/reglas clínicas pendientes (FA01).

Si no se abre correctiva inmediata, el cierre técnico del entregable actual es **válido** con matriz CU en estado **Parcial** aceptado y riesgos en §9.

---

## 14. Checklist UAT E2E (referencia operativa)

Para registro de evidencia en operaciones (opcional post-Fase 9):

- [ ] Recorrido portal CU01 completo con buscador (3 tipos de resultado + sin resultados).
- [ ] Login por al menos 3 roles distintos + intento ruta protegida sin sesión.
- [ ] Cadena paciente → seguro → cita → admisión → triage (emergencia) → atención → orden LAB → lab → pago.
- [ ] Anular admisión y verificar bloqueos.
- [ ] Reportes + CSV como ADMINISTRADOR; 403 con rol sin permiso.
- [ ] Consulta bitácora tras desactivar/anular un registro.

---

## Documentos relacionados

- `docs/fase_8_1_baja_logica_segura.md`
- `docs/fase_8_2_politica_eliminacion_modulos_pendientes.md`
- `docs/fase_7_2_portal_publico_informativo.md`
- `docs/fase_6_2_farmacia_inventario.md`
- `docs/plan_auditoria_refactorizacion_casos_uso.md`
