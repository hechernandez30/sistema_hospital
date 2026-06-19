# Fase 9.2 — Rediseño del módulo de Citas (agenda CU04)

## Resumen ejecutivo

La pantalla principal de **Citas** (`/app/citas`) deja de ser solo una tabla administrativa y pasa a ofrecer una **vista Agenda** (por defecto) alineada con CU04 (agenda por médico y calendario), más una **vista Listado** secundaria. No se modificó backend, base de datos ni reglas de negocio (solapamiento, estados, baja lógica).

---

## Qué se modificó

### Nuevos archivos

| Ruta | Rol |
|------|-----|
| `frontend/src/app/features/appointments/appointment-page.utils.ts` | Filtros por rango, layout horario, columnas médico/semana/mes |
| `frontend/src/app/features/appointments/components/appointment-agenda.component.ts` | Vista agenda (día / semana / mes) |
| `frontend/src/app/features/appointments/components/appointment-agenda.component.html` | Plantilla de grilla y calendario mensual |
| `frontend/src/app/features/appointments/components/appointment-agenda.component.scss` | Estilos de agenda (bloques, leyenda, mes) |
| `docs/fase_9_2_rediseno_modulo_citas_agenda.md` | Este documento |

### Archivos actualizados

| Ruta | Cambio |
|------|--------|
| `appointment-list-page.component.ts/html/scss` | Orquestación: dos modos, filtros compartidos, carga vía APIs existentes |
| `appointment-form-dialog.component.ts` | `prefill` opcional (médico, especialidad, inicio/fin) al crear desde hueco horario |
| `appointment-detail-dialog.component.ts/html` | Botones Editar y Cancelar cita (cuando `showActions: true`) |

### Sin cambios

- `AppointmentApiService` y endpoints REST (`GET/POST/PUT/DELETE /api/appointments`)
- Validaciones de solapamiento y estados en backend
- Baja lógica (`DELETE` → `CANCELADA`)
- CU01, base de datos, otros módulos

---

## Vista Agenda (principal, por defecto)

### Modos de calendario

| Modo | Comportamiento |
|------|----------------|
| **Día** | Columnas por **médico** (activos según filtros); franjas 07:00–20:00 cada 30 min; citas como bloques posicionados por hora |
| **Semana** | Siete columnas (lun–dom); misma escala horaria; recomendación UI si no hay médico seleccionado |
| **Mes** | Calendario mensual compacto; hasta 3 citas por día + contador; **clic en día** → cambia a vista **Día** en esa fecha |

Navegación: anterior / **Hoy** / siguiente (según modo: día, semana o mes).

### Información en cada bloque de cita

- Hora inicio – fin
- Nombre del paciente (incluye código en tooltip)
- Estado (chip con colores CU04)
- Especialidad (vista día, si aplica)
- Médico (vista semana sin filtro de médico)

### Estados visuales

Reutiliza `appointment-status-chip.ts` y `appointment-status.styles.scss`:

`PROGRAMADA`, `REPROGRAMADA`, `CANCELADA`, `ATENDIDA`, `NO_ASISTIO`.

### Interacciones

- **Nueva cita**: botón en barra superior (igual que antes).
- **Clic en cita**: abre detalle; desde detalle → Editar o Cancelar.
- **Clic en horario vacío** (día/semana): abre formulario de alta con médico (si aplica), fecha/hora y fin +30 min.
- **Sin drag & drop** en esta fase.

---

## Vista Listado (secundaria)

- Toggle **Agenda | Listado** (Material button toggle).
- Tabla anterior conservada: ID, paciente, médico, especialidad, inicio, estado, acciones.
- Búsqueda textual adicional solo en listado.
- Mismos filtros globales (médico, especialidad, fecha, estado) aplicados al subconjunto del rango de la agenda activa.
- Paginación y ordenación Material sin cambios de contrato.

---

## Filtros implementados

| Filtro | Alcance |
|--------|---------|
| Médico | Cliente; `Todos` o un médico (`staff` MEDICO activo, o etiquetas derivadas de citas si no hay catálogo RRHH) |
| Especialidad | Cliente; cita con `specialtyId` o médico con esa especialidad (si hay catálogo) |
| Fecha | `input type="date"`; ancla la vista agenda y el rango del listado |
| Estado | Todos o un estado CU04 |
| Rango agenda | Día / Semana / Mes (solo en vista Agenda) |

Datos: `GET /api/appointments`, `GET /api/patients`, y según rol `GET /api/staff`, `GET /api/specialties` (mismo patrón que la lista previa).

---

## Qué no se implementó y por qué

| Ítem | Motivo |
|------|--------|
| **Drag & drop** para reprogramar | Fuera de alcance; complejidad y riesgo de reglas de solapamiento en cliente |
| **Vista mensual con grilla horaria** | Mes es resumen; el detalle horario se delega a vista Día al pulsar un día |
| **Biblioteca externa** (FullCalendar, etc.) | No estaba en dependencias; agenda custom con Material/CSS para no ampliar stack |
| **Endpoint nuevo** por médico/fecha | No indispensable; filtrado en cliente sobre listado existente |
| **Ocultar citas canceladas por defecto** | Se mantiene comportamiento de listado completo; filtro por estado disponible |
| **Multi-médico en semana sin filtro** | Posible saturación visual; se muestra aviso para seleccionar médico |

---

## Pruebas obligatorias

### Frontend — `npm run build`

Ejecutado en `frontend/`:

- **Resultado:** exit code **0**
- **Salida:** `Application bundle generation complete`
- **Advertencias:** presupuesto SCSS de `appointment-agenda.component.scss` (+669 B sobre 4 kB) y `public-layout` (preexistente); no bloquean compilación.

### Backend — `mvn clean compile test`

**No aplicó** (sin cambios en backend).

### Smoke test manual recomendado

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| 1 | Abrir `/app/citas` | Vista **Agenda** por defecto, modo **Día** |
| 2 | Cambiar a **Semana** / **Mes** | Grilla o calendario acorde; mes → clic día → día |
| 3 | Filtrar por médico y fecha | Bloques / listado acotados |
| 4 | **Nueva cita** y crear | Flujo POST sin cambios; recarga agenda |
| 5 | Clic en cita → detalle → Editar | Formulario edición; PUT OK |
| 6 | Detalle → Cancelar cita | Diálogo confirmación; DELETE lógico |
| 7 | Clic hueco horario vacío | Alta con hora/médico prellenados |
| 8 | Vista **Listado** | Tabla, búsqueda, acciones íconos |
| 9 | Leyenda de estados | Chips coherentes con lista/detalle |

---

## Riesgos y mejoras futuras

- **Rendimiento:** con muchas citas, convendría filtro por rango en API (`?from=&to=&doctorId=`) sin cambiar contrato público actual.
- **Zona horaria:** layout usa hora local del navegador; alinear con política del hospital si hay sedes multi-zona.
- **Presupuesto CSS:** subir límite en `angular.json` o extraer estilos compartidos si el warning molesta en CI.
- **Roles sin RRHH:** filtro de especialidad oculto; médicos inferidos solo desde citas cargadas.
- **Recordatorios / notificaciones** CU04: sin cambios en esta fase.

---

## Estado del proyecto

Tras el build frontend exitoso y sin tocar backend, el proyecto se considera **estable** para continuar desarrollo; validar en intranet con datos reales el smoke test anterior.

---

## Ajuste UI — fecha y hora en la misma fila (formulario de citas)

**Fecha:** 2026-05-21

### Qué se modificó

| Archivo | Cambio |
|---------|--------|
| `appointment-form-dialog.component.html` | Bloques `datetime-blocks` / `datetime-block` para Inicio y Fin; clase `apt-datetime` en cada `app-datetime-local-field` |
| `appointment-form-dialog.component.scss` | Layout: fecha + hora + minuto en **una sola fila** por bloque; responsivo (apilado ordenado en pantallas pequeñas) |

### Diseño resultante

- **Inicio:** `[Fecha inicio]` `[HH]` `:` `[MM]` en la misma fila, a la derecha de la fecha.
- **Fin:** `[Fecha fin]` `[HH]` `:` `[MM]` en la misma fila, a la derecha de la fecha.
- En escritorio, los bloques Inicio y Fin pueden compartir fila si hay espacio.
- En tablet/móvil (&lt; 600px): Inicio y Fin en columna; dentro de cada bloque, fecha y hora siguen en fila si caben.
- En móvil estrecho (&lt; 420px): dentro de cada bloque, la hora pasa debajo de la fecha de forma ordenada.

### Confirmaciones

| Área | ¿Cambió? |
|------|----------|
| Layout visual del formulario de citas | Sí |
| Lógica de fechas / validaciones / `datetime-local` | No |
| Cálculo «Calcular hora fin» / duración por especialidad | No |
| DTOs, backend, rutas, agenda CU04 | No |
| Otros módulos | No |

### Build

```text
npm run build — OK (exit 0)
```

Warnings previos de presupuesto CSS en `appointment-agenda` y `public-layout` (sin relación con este ajuste).

### Pruebas recomendadas (smoke)

1. Nueva cita: Inicio y Fin muestran fecha y hora en la misma fila.
2. Redimensionar ventana: sin desbordamiento horizontal; apilado correcto en móvil.
3. «Calcular hora fin» sigue actualizando Fin.
4. Crear / editar cita y validación fin &gt; inicio sin regresiones.

---

*Fase 9.2 — 2026-05-21*
