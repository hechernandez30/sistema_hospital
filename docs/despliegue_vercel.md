# Vercel — frontend Angular

Guía para desplegar `frontend/` en [Vercel](https://vercel.com) apuntando al backend en Railway.

---

## Requisitos previos

- Backend Railway **Live** (ej. `https://hospital-api-production-xxxx.up.railway.app`).
- Probar: `GET https://TU-BACKEND/actuator/health/liveness` → `{"status":"UP"}`.
- Repo en GitHub: `hechernandez30/sistema_hospital`.

---

## Paso 1 — Importar proyecto en Vercel

1. Entra a [vercel.com](https://vercel.com) → **Add New…** → **Project**.
2. **Import** el repo `sistema_hospital`.
3. En **Configure Project**:

| Campo | Valor |
|-------|--------|
| **Framework Preset** | Other (o deja que detecte `vercel.json`) |
| **Root Directory** | `frontend` ← **importante** |
| **Build Command** | `npm run build:vercel` (ya en `vercel.json`) |
| **Output Directory** | `dist/hospital-web/browser` (ya en `vercel.json`) |
| **Install Command** | `npm install` (default) |

---

## Paso 2 — Variable de entorno `API_URL`

Antes del primer deploy, en **Environment Variables**:

| Name | Value | Environments |
|------|--------|--------------|
| `API_URL` | `https://TU-BACKEND.up.railway.app` | Production (y Preview si quieres) |

Reglas:

- **HTTPS**, sin `/` al final.
- **Sin** `/api` al final (el frontend ya agrega `/api/...`).
- Ejemplo correcto: `https://hospital-api-production-a1b2.up.railway.app`

El script `scripts/write-environment.mjs` genera `environment.ts` en cada build con esa URL.

---

## Paso 3 — Deploy

1. Clic en **Deploy**.
2. Espera ~1–2 minutos.
3. Vercel te dará una URL tipo: `https://sistema-hospital-xxxx.vercel.app`.

---

## Paso 4 — CORS en Railway (obligatorio)

El backend debe permitir el origen de Vercel.

1. Railway → servicio **backend** → **Variables**.
2. Actualiza o agrega:

```
CORS_ORIGIN=https://TU-APP.vercel.app
```

3. **Redeploy** el backend en Railway.

> Si usas dominio custom en Vercel, usa esa URL exacta. Sin `CORS_ORIGIN` correcto verás errores de CORS en el navegador al hacer login.

---

## Paso 5 — Verificación

1. Abre la URL de Vercel.
2. Inicia sesión con un usuario de la BD (ej. admin del seed).
3. Si falla:
   - **CORS** → revisa `CORS_ORIGIN` en Railway.
   - **Network error / 401 en login** → revisa `API_URL` en Vercel (debe ser la URL pública del backend).
   - **502 / timeout** → despierta el backend (cold start Railway ~30–60 s).

---

## Redeploys posteriores

- **Push a `main`** → Vercel redeploy automático.
- Cambiar backend URL → edita `API_URL` en Vercel → **Redeploy**.

---

## Preview deployments

Cada PR puede generar una URL preview. Si quieres que funcionen:

1. Define `API_URL` también para **Preview** en Vercel.
2. En Railway, `CORS_ORIGIN` solo admite **un** origen hoy; para previews necesitarías ampliar `app.cors.allowed-origins` en el backend o usar solo Production en la demo.

---

## Resumen de URLs

```
Usuario → Vercel (Angular)
              ↓  HTTPS + JWT
         Railway (Spring Boot)
              ↓
         PostgreSQL (Railway)
```
