# Despliegue express (Railway + Vercel)

Guía para tener el sistema en línea **un día** (demo/entrega).

## Por qué falló Railway

El repo es un **monorepo** (`backend/` + `frontend/`). Railway (Railpack) no sabe qué compilar si apuntas a la raíz. Hay que desplegar **solo `backend/`** con Docker.

---

## 1. Subir cambios a GitHub

Incluye `backend/Dockerfile`, `backend/railway.toml` y `application-railway.yml`.

---

## 2. Railway — backend + PostgreSQL

### 2.1 Proyecto

1. [railway.com](https://railway.com) → login con GitHub.
2. **New Project** → **Deploy from GitHub** → `hechernandez30/sistema_hospital`.

### 2.2 Servicio Java (importante)

En el servicio web → **Settings**:

| Campo | Valor |
|-------|--------|
| **Root Directory** | `backend` |
| **Builder** | Dockerfile |

Guarda y **Redeploy**.

### 2.3 PostgreSQL

1. En el mismo proyecto: **+ New** → **Database** → **PostgreSQL**.
2. En el servicio **backend** → **Variables** → **Add Reference** (desde Postgres):
   - `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

### 2.4 Variables manuales (servicio backend)

| Variable | Valor |
|----------|--------|
| `SPRING_PROFILES_ACTIVE` | `railway` (el Dockerfile ya lo fija; redundante pero útil) |
| `DATABASE_URL` | Referencia `${{Postgres.DATABASE_URL}}` **o** variables `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` |
| `JWT_SECRET` | Clave UTF-8 de al menos 32 caracteres (opcional: hay default en perfil `railway`) |
| `CORS_ORIGIN` | URL de Vercel — actualizar después del paso 3 |
| `MAIL_ENABLED` | `false` |

> **Healthcheck:** Railway usa `/actuator/health/liveness` (solo JVM viva). `/actuator/health` completo falla si la BD no responde.

### 2.5 Cargar la base de datos (obligatorio antes del deploy)

1. Postgres → **Connect** → copia la URL externa.
2. Ejecuta con `psql` o DBeaver:
   - `hospital_postgresql_15_tablas_es.sql` (schema + datos base)
   - Opcional: `backend/scripts/seed-dev-postgresql.sql`

### 2.6 URL del API

Settings → **Networking** → **Generate Domain** (ej. `https://hospital-api-production-xxxx.up.railway.app`).

Prueba: `GET https://TU-URL/actuator/health/liveness` → `{"status":"UP"}`.

---

## Solución de problemas (healthcheck)

| Síntoma en logs | Causa | Solución |
|-----------------|-------|----------|
| `Connection refused` / timeout healthcheck | App no arrancó o puerto incorrecto | Verifica `Root Directory = backend`, redeploy con Dockerfile nuevo |
| `Could not resolve placeholder 'JWT_SECRET'` | Perfil `railway` sin default antiguo | Pull último código o define `JWT_SECRET` |
| `Schema-validation: missing table` | SQL no ejecutado | Ejecuta `hospital_postgresql_15_tablas_es.sql` en Postgres |
| `Connection to localhost:5432` | Perfil `railway` no activo | `SPRING_PROFILES_ACTIVE=railway` |
| Healthcheck 401 | Ruta actuator bloqueada | Pull último código (permite `/actuator/health/**`) |
| Healthcheck 503 en `/actuator/health` | BD caída o schema inválido | Usa liveness; carga SQL; referencia `${{Postgres.DATABASE_URL}}` |
| `PSQLException` SSL | `sslmode=require` en red interna | Pull último código (`sslmode=prefer`) |

---

## 3. Vercel — frontend

1. [vercel.com](https://vercel.com) → importar `hechernandez30/sistema_hospital`.
2. **Root Directory**: `frontend`
3. Antes del deploy, edita `frontend/src/environments/environment.ts`:

```typescript
apiUrl: 'https://TU-URL-RAILWAY.up.railway.app',
```

4. Deploy.

### CORS

Vuelve a Railway y pon `CORS_ORIGIN` = URL exacta de Vercel (sin `/` final). Redeploy backend.

---

## 4. Antes de la demo

- Abre la app y haz login **5 minutos antes** (cold start JVM ~30–60 s).
- Evita subir adjuntos de laboratorio en demo (disco efímero en Railway free).

---

## 5. Después de la demo

Borrar proyecto en Railway y Vercel.
