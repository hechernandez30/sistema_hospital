# Vercel — frontend Angular

Despliegue de `frontend/` en producción.

## URLs del proyecto

| Servicio | URL |
|----------|-----|
| **Frontend (Vercel)** | https://sistema-hospital-lake.vercel.app |
| **Backend (Railway)** | https://sistemahospital-production-80d5.up.railway.app |

Healthcheck backend: `GET https://sistemahospital-production-80d5.up.railway.app/actuator/health/liveness`

---

## Configuración en Vercel

| Campo | Valor |
|-------|--------|
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build:vercel` |
| **Output Directory** | `dist/hospital-web/browser` |

La variable `API_URL` ya está en `frontend/vercel.json`:

```
https://sistemahospital-production-80d5.up.railway.app
```

Opcionalmente puedes repetirla en Vercel → **Settings → Environment Variables** → `API_URL` (Production).

---

## CORS en Railway

En el servicio **backend** → **Variables**:

```
CORS_ORIGIN=https://sistema-hospital-lake.vercel.app
```

Redeploy del backend después de cambiarla.

> El perfil `prod`/`railway` ya usa esa URL como valor por defecto si no defines `CORS_ORIGIN`.

---

## Verificación

1. Abre https://sistema-hospital-lake.vercel.app
2. Inicia sesión
3. Si hay error CORS → confirma `CORS_ORIGIN` en Railway y redeploy backend
4. Si timeout → cold start Railway (~30–60 s); reintenta

---

## Redeploy

Push a `main` → Vercel redeploy automático del frontend.
