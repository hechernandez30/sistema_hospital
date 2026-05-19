# Fase 8 — Pruebas funcionales extremo a extremo (E2E)

## Resumen ejecutivo

Se ejecutaron las pruebas técnicas obligatorias del proyecto:

- Backend: `mvn clean compile test` ✅
- Frontend: `npm run build` ✅

Resultado global: **estable en compilación y suite automatizada existente**, con cobertura funcional **parcial** para E2E manual completo.  
No se implementaron nuevas funcionalidades en esta fase; se documenta el estado funcional por escenarios y los pendientes de validación operativa final.

## Ambiente usado

- SO: Windows 10 (win32 10.0.26200)
- Backend: Java 17 / Spring Boot 3.4.4
- Frontend: Angular (build de producción)
- Repositorio: `sistema_hospital`
- Fecha de ejecución: 2026-05-06

## Datos de prueba usados o sugeridos

### Datos usados en esta fase

- Pruebas automatizadas existentes del backend (WebMvc tests del proyecto).
- Build de frontend para validar integridad de módulos y rutas.

### Datos sugeridos para validación manual final (UAT)

- Paciente nuevo con DPI/NIT únicos.
- Paciente alterno para validar colisiones/duplicados.
- Usuario con rol ADMINISTRADOR y AUDITOR para reportes/seguridad.
- Usuario con rol no autorizado para pruebas 403.
- Token ausente/expirado para pruebas 401.
- Casos de pago: sin seguro, seguro parcial, seguro 100%.
- Orden médica tipo LABORATORIO y orden tipo no-LAB para rechazo esperado.
- Medicamentos con `currentStock <= minimumStock` y con `currentStock > minimumStock`.

## Matriz de escenarios (estado)

Leyenda: **OK** = validado con evidencia directa en esta fase; **Parcial** = validado por build/tests + revisión estática/documentación previa; **No probado** = requiere ejecución manual dedicada.

| # | Módulo / escenario | Estado | Evidencia textual |
|---|---|---|---|
| 1 | Portal público CU01 | Parcial | Frontend build OK; rutas públicas y buscador integrados en fases 7.2.x; requiere recorrido manual completo de UX final. |
| 2 | Pacientes y seguros CU02 | Parcial | Backend tests/build OK; cobertura de reglas validada en fases previas, pero sin corrida manual E2E completa en esta fase. |
| 3 | Usuarios, roles y personal CU03/CU14 parcial | Parcial | Compilación/Tests OK; verificación manual de flujos CRUD/duplicados/password pendiente como UAT dirigida. |
| 4 | Citas CU04 | Parcial | Build/tests OK; reglas de fechas/solapamiento documentadas previamente; falta ejecución manual integral en esta fase. |
| 5 | Admisiones CU11 | Parcial | Build/tests OK; reglas financieras/seguro/pago-sitio validadas en fases previas; falta smoke manual completo aquí. |
| 6 | Triage CU10 | Parcial | Módulo compila y pruebas pasan; pendientes funcionales específicos ya identificados (vitales obligatorios y paro cardiorrespiratorio). |
| 7 | Atención médica CU12 | Parcial | Build/tests OK; reglas de admisión/cita auditadas en etapas previas; falta corrida manual de todos los caminos. |
| 8 | Órdenes/muestras/laboratorio CU06/CU07 | Parcial | Sin regresiones de build/tests; integración funcional ya trabajada, pero esta fase no ejecutó todos los casos manuales uno a uno. |
| 9 | Pagos y seguros CU09 | Parcial | Build/tests OK; mejoras de mensajes y cobertura sugerida implementadas antes; falta validación manual completa en esta fase. |
|10 | Farmacia e inventario CU13 parcial | Parcial | Sin regresiones; CU13 mantiene alcance parcial documentado (sin despacho real por modelo faltante). |
|11 | Reportes CU08 | Parcial | Módulo de reportes compila, frontend build OK; export CSV y filtros requieren corrida manual final con usuarios/roles reales. |
|12 | Seguridad/Roles | Parcial | SecurityConfig y guards ya definidos; validación 401/403/rutas públicas requiere suite manual o pruebas de integración dedicadas. |

## Resultado por escenario obligatorio (detalle breve)

### 1) Portal público CU01

- Inicio/menú/secciones y buscador ya trabajados en Fase 7.2.
- Estado actual: **Parcial** (sin regresión técnica detectada; pendiente check manual final completo de navegación y UX).
- Confirmado por diseño actual: no registro/reserva pública; login interno vigente.

### 2) Pacientes y seguros CU02

- Validaciones y auditoría ya abordadas en fases previas.
- Estado: **Parcial** (no se ejecutó matriz manual completa en esta fase).

### 3) Usuarios, roles y personal CU03/CU14 parcial

- Estado: **Parcial**.
- Requiere sesión manual dedicada para duplicados, password policy y exposición de campos sensibles.

### 4) Citas CU04

- Estado: **Parcial**.
- Requiere smoke manual de solapamientos por médico y edición/cancelación.

### 5) Admisiones CU11

- Estado: **Parcial**.
- Requiere validar manualmente variantes (seguro vigente / pago sitio / rechazos esperados).

### 6) Triage CU10

- Estado: **Parcial**.
- Pendientes funcionales conocidos documentados (vitales obligatorios, paro cardiorrespiratorio).

### 7) Atención médica CU12

- Estado: **Parcial**.
- Requiere prueba manual de combinaciones admisión-cita y validaciones de campos clínicos.

### 8) Órdenes, muestras y laboratorio CU06/CU07

- Estado: **Parcial**.
- Requiere confirmar manualmente rechazo de tipo de orden no compatible y unicidad de laboratorio por orden.

### 9) Pagos y seguros CU09

- Estado: **Parcial**.
- Requiere smoke manual final de método obligatorio en PAGADO, total 0 con cobertura 100%, y rechazos.

### 10) Farmacia e inventario CU13 parcial

- Estado: **Parcial**.
- Se mantiene limitación de despacho real pendiente por falta de modelo de líneas/movimientos.

### 11) Reportes CU08

- Estado: **Parcial**.
- Requiere ejecución manual por rol (ADMINISTRADOR/AUDITOR), filtros válidos/ inválidos y export CSV.

### 12) Seguridad/Roles

- Estado: **Parcial**.
- Requiere matriz manual o pruebas automatizadas específicas de 401/403 por endpoint/rol.

## Evidencia técnica ejecutada en esta fase

### Backend

- Comando: `mvn clean compile test`
- Resultado: **OK** (exit code 0).
- Evidencia observada: arranque de WebMvc tests (audit log, patient, payment, role), sin fallas bloqueantes.

### Frontend

- Comando: `npm run build`
- Resultado: **OK** (exit code 0).
- Observación: warning no bloqueante de presupuesto CSS en `public-layout.component.scss`.

## Defectos encontrados

### Defectos bloqueantes

- **Ninguno** en compilación y pruebas técnicas obligatorias.

### Hallazgos no bloqueantes

1. **Warning de budget CSS** en frontend:
   - Archivo: `public-layout.component.scss`
   - Impacto: no bloquea build ni ejecución.
   - Recomendación: refactorizar estilos del buscador/header en fase de hardening visual.

## Pendientes funcionales

- Ejecutar matriz manual completa con evidencia (capturas/logs) para los 12 grupos de escenarios.
- Incorporar, si se decide, pruebas de integración/API enfocadas en:
  - 401/403 por rol y endpoint.
  - Casos frontera de fechas/rangos.
  - Reglas de negocio con cobertura negativa/positiva por módulo.

## Riesgos para entrega

- Riesgo principal: **brecha entre validación técnica (build/tests) y validación operativa manual completa**.
- Riesgo funcional conocido y aceptado:
  - CU13 despacho real pendiente por modelo de datos aún no implementado.
  - CU10 con pendientes funcionales ya documentados.

## Recomendación para Fase 9

1. Ejecutar una ronda formal de **UAT guiada por la matriz de esta fase**, con registro de evidencia por caso.
2. Agregar una suite mínima automatizada de seguridad por rol (401/403) para endpoints críticos.
3. Cerrar warning de budget CSS y revisar consistencia visual final del portal público.
4. Consolidar reporte de “go/no-go” con criterios de aceptación por CU.

## Confirmación de estabilidad del proyecto

Con base en la ejecución técnica de esta fase:

- Backend compila y tests pasan.
- Frontend build de producción genera correctamente.
- No se detectaron bloqueantes de compilación.

Estado actual: **proyecto estable técnicamente**, con **pendientes de validación manual funcional integral** antes del cierre final de aceptación.
