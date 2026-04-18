# API REST — Sistema hospitalario (backend)

Base URL por defecto: `http://localhost:8080`  
Todas las rutas bajo el prefijo documentado devuelven JSON salvo `204 No Content` en borrados.

## Salud

| Método | Ruta | Descripción |
|--------|------|---------------|
| GET | `/actuator/health` | Estado de la aplicación |

---

## Roles

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/roles` | Listar |
| GET | `/api/roles/{id}` | Obtener |
| POST | `/api/roles` | Crear |
| PUT | `/api/roles/{id}` | Actualizar |
| DELETE | `/api/roles/{id}` | Eliminar |

## Usuarios

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/users` | Listar |
| GET | `/api/users/{id}` | Obtener |
| POST | `/api/users` | Crear |
| PUT | `/api/users/{id}` | Actualizar |
| DELETE | `/api/users/{id}` | Eliminar |

## Especialidades

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/specialties` | Listar |
| GET | `/api/specialties/{id}` | Obtener |
| POST | `/api/specialties` | Crear |
| PUT | `/api/specialties/{id}` | Actualizar |
| DELETE | `/api/specialties/{id}` | Eliminar |

## Personal (staff)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/staff` | Listar |
| GET | `/api/staff/{id}` | Obtener |
| POST | `/api/staff` | Crear |
| PUT | `/api/staff/{id}` | Actualizar |
| DELETE | `/api/staff/{id}` | Eliminar |

## Pacientes

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/patients` | Listar |
| GET | `/api/patients/{id}` | Obtener |
| POST | `/api/patients` | Crear |
| PUT | `/api/patients/{id}` | Actualizar |
| DELETE | `/api/patients/{id}` | Eliminar |

## Seguros (por paciente)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/patients/{patientId}/insurances` | Listar |
| GET | `/api/patients/{patientId}/insurances/{insuranceId}` | Obtener |
| POST | `/api/patients/{patientId}/insurances` | Crear |
| PUT | `/api/patients/{patientId}/insurances/{insuranceId}` | Actualizar |
| DELETE | `/api/patients/{patientId}/insurances/{insuranceId}` | Eliminar |

## Medicamentos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/medications` | Listar |
| GET | `/api/medications/{id}` | Obtener |
| POST | `/api/medications` | Crear |
| PUT | `/api/medications/{id}` | Actualizar |
| DELETE | `/api/medications/{id}` | Eliminar |

## Citas

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/appointments` | Listar |
| GET | `/api/appointments/{id}` | Obtener |
| POST | `/api/appointments` | Crear |
| PUT | `/api/appointments/{id}` | Actualizar |
| DELETE | `/api/appointments/{id}` | Eliminar |

## Admisiones

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/admissions` | Listar |
| GET | `/api/admissions/{id}` | Obtener |
| POST | `/api/admissions` | Crear |
| PUT | `/api/admissions/{id}` | Actualizar |
| DELETE | `/api/admissions/{id}` | Eliminar |

## Triage

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/triage` | Listar (opcional `?admissionId=`) |
| GET | `/api/triage/{id}` | Obtener |
| POST | `/api/triage` | Crear |
| PUT | `/api/triage/{id}` | Actualizar |
| DELETE | `/api/triage/{id}` | Eliminar |

## Atenciones médicas

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/medical-cares` | Listar (opcional `?patientId=`) |
| GET | `/api/medical-cares/{id}` | Obtener |
| POST | `/api/medical-cares` | Crear |
| PUT | `/api/medical-cares/{id}` | Actualizar |
| DELETE | `/api/medical-cares/{id}` | Eliminar |

## Órdenes médicas

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/medical-orders` | Listar (opcional `?medicalCareId=`) |
| GET | `/api/medical-orders/{id}` | Obtener |
| POST | `/api/medical-orders` | Crear |
| PUT | `/api/medical-orders/{id}` | Actualizar |
| DELETE | `/api/medical-orders/{id}` | Eliminar |

## Laboratorio

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/laboratory` | Listar (opcional `?medicalOrderId=` devuelve un ítem) |
| GET | `/api/laboratory/{id}` | Obtener |
| POST | `/api/laboratory` | Crear |
| PUT | `/api/laboratory/{id}` | Actualizar (resultados, estado, etc.) |
| DELETE | `/api/laboratory/{id}` | Eliminar |

## Imágenes

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/imaging` | Listar (opcional `?medicalOrderId=`) |
| GET | `/api/imaging/{id}` | Obtener |
| POST | `/api/imaging` | Crear |
| PUT | `/api/imaging/{id}` | Actualizar (informe, archivo, fechas) |
| DELETE | `/api/imaging/{id}` | Eliminar |

## Pagos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/payments` | Listar (opcional `?patientId=`) |
| GET | `/api/payments/{id}` | Obtener |
| POST | `/api/payments` | Crear |
| PUT | `/api/payments/{id}` | Actualizar |
| DELETE | `/api/payments/{id}` | Eliminar |

## Bitácora

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/audit-logs` | Listar (opcional `?module=` o `?userId=`; si hay `module` tiene prioridad) |
| GET | `/api/audit-logs/{id}` | Obtener |
| POST | `/api/audit-logs` | Registrar evento (solo alta) |

---

## Errores

Las respuestas de error siguen el formato definido en el manejador global (`timestamp`, `status`, `error`, `message`, `path`, `fieldErrors` opcional).

## Pruebas automatizadas

```bash
cd backend
mvn test
```

Las pruebas de Fase 7 usan `@WebMvcTest` (capa web sin PostgreSQL).
