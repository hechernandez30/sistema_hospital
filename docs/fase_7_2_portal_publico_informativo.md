# Fase 7.2 — Portal público informativo (CU01)

## Qué se revisó

- **Rutas públicas** bajo `/p` en `public.routes.ts`.
- **Secciones existentes**: Inicio, Nosotros, Servicios, Especialidades, Contacto, Acceso personal.
- **Menú/layout público** (`public-layout.component.*`).
- **Contenido**:
  - Servicios: contenido local (frontend).
  - Especialidades: carga desde `assets/data/specialties.json`.
- **Llamadas públicas a backend**:
  - Se verificó que **no existen** llamadas públicas a `/api` en páginas públicas informativas.
  - **Login** es la única excepción, pues es acceso de personal autorizado y forma parte del CU01.

## Qué se modificó

### Portal público (frontend)

- Se agregó sección **Médicos** informativa:
  - Ruta: `/p/medicos`.
  - Contenido estático seguro desde `assets/data/doctors.json`.
  - Aclaración explícita: **sin disponibilidad real** y **sin agenda pública**.
- Se agregó **buscador público** en Inicio:
  - Busca sobre datos **locales** (assets) de **servicios, especialidades y médicos**.
  - Resultados con estado “sin resultados” y enlaces a secciones públicas.
  - **Sin** consumo de endpoints internos protegidos.

### Assets (contenido público)

- `assets/data/services.json`: catálogo público de servicios (informativo).
- `assets/data/doctors.json`: médicos públicos (informativo).

## Qué no se modificó y por qué

- **Backend / endpoints**: no se añadieron endpoints públicos nuevos (preferencia por assets estáticos).
- **Base de datos**: sin cambios (restricción explícita).
- **Intranet**: sin cambios (no era necesario).
- **Flujo de login**: no se alteró; solo se mantuvo el acceso desde `/p/acceso`.
- No se implementó:
  - **Registro público** de pacientes.
  - **Reserva/solicitud pública** de citas.
  - **Pagos** públicos.
  - **Admisiones/órdenes** públicas.
  - Formularios públicos que muten datos hospitalarios.

## Estado final de CU01

- **Portal institucional e informativo**: Inicio, Nosotros, Servicios, Especialidades, Médicos, Contacto.
- **Acceso**: Login para personal autorizado (sin cambios de flujo).
- **Buscador público**: implementado (contenido estático/seguro).
- **Cumplimiento de alcance**: confirmado **sin registro ni reserva pública**.

## Secciones públicas implementadas

- Inicio (`/p/inicio`)
- Quiénes somos (`/p/nosotros`)
- Servicios (`/p/servicios`)
- Especialidades (`/p/especialidades`)
- Médicos (`/p/medicos`)
- Contacto (`/p/contacto`)
- Acceso personal / Login (`/p/acceso`)

## Buscador implementado o pendiente

- **Implementado** en Inicio:
  - Fuente: `assets/data/services.json`, `assets/data/specialties.json`, `assets/data/doctors.json`.
  - Comportamiento:
    - Devuelve resultados públicos.
    - Muestra mensaje “sin resultados”.
    - No consume `/api`.

## Médicos públicos implementados o pendientes

- **Implementado**:
  - Muestra nombre, especialidad, perfil público y horario referencial (si existe).
  - Sin agenda real ni acciones de reserva.

## Confirmación: no existe registro / reserva pública

- El portal público **no ofrece** registro, solicitud ni reserva de citas, ni formularios de mutación hospitalaria.
- El único flujo con backend desde `/p` es **login de personal** (CU01).

## Archivos modificados

### Frontend — rutas/layout público

- `frontend/src/app/public/public.routes.ts`
- `frontend/src/app/public/layout/public-layout.component.html`
- `frontend/src/app/public/pages/home/home.component.ts`
- `frontend/src/app/public/pages/home/home.component.html`
- `frontend/src/app/public/pages/home/home.component.scss`

### Frontend — portal público (nuevo)

- `frontend/src/app/public/pages/doctors/doctors.component.ts`
- `frontend/src/app/public/pages/doctors/doctors.component.html`
- `frontend/src/app/public/pages/doctors/doctors.component.scss`
- `frontend/src/app/public/models/public-content.models.ts`
- `frontend/src/app/public/services/public-content.service.ts`

### Assets (nuevo)

- `frontend/src/assets/data/services.json`
- `frontend/src/assets/data/doctors.json`

### Documentación

- `docs/fase_7_2_portal_publico_informativo.md`

## Resultado build frontend

- Ejecutado: `npm run build`
- Resultado: **OK** (exit code 0).
- Nota: existe un **warning de budget** por tamaño de `home.component.scss` (no impide build).

## Resultado backend (si aplica)

- **No aplica**: no se modificó backend en esta fase.

## Smoke / validación funcional documentada

- Inicio carga correctamente: OK.
- Servicios carga correctamente: OK.
- Especialidades carga correctamente: OK (assets).
- Médicos carga: OK (assets).
- Buscador devuelve resultados públicos: OK (assets).
- Buscador sin resultados muestra mensaje: OK.
- Contacto carga correctamente: OK.
- Acceso personal redirige/login funciona: OK (sin cambios de flujo).
- Confirmación de no mutaciones públicas: OK (sin POST/PUT/DELETE desde `/p` fuera de login).

## Riesgos pendientes

- **Contenido estático**: requiere mantenimiento manual (assets) si cambia información institucional.
- **Budget CSS**: el build avisa por excedente en `home.component.scss`; no rompe compilación, pero conviene optimizar en fase futura.

## Recomendación para Fase 8

- Definir política de contenido público:
  - si se mantiene en assets o si se justifica un backend read-only de contenido público.
- Optimizar estilos del home para reducir budget CSS si se decide mantener esa restricción.
- Añadir accesibilidad adicional (teclado/ARIA) al buscador si se amplía su uso.
