# Casos de Uso Detallados - Sistema Hospitalario Hospital H&H

## Propósito del documento

Este documento consolida los 14 casos de uso funcionales del sistema hospitalario **Hospital H&H** tomando como fuente oficial los documentos Word proporcionados para el proyecto.

Debe utilizarse como fuente de referencia para revisar cobertura funcional, planificar refactorizaciones controladas y validar que backend, frontend, seguridad, reglas de negocio y experiencia de usuario respeten el alcance descrito en los casos de uso originales.

## Criterio de corrección aplicado

- Se prioriza el contenido de los documentos Word sobre versiones previas del archivo Markdown.
- No se agregan flujos, reglas, estados, criterios ni módulos que no estén descritos en los documentos fuente.
- Los requerimientos suplementarios se mantienen de forma homogénea cuando aparecen iguales en los documentos Word.
- CU05 se conserva como documento consolidado de reglas de negocio, aunque no tenga actores, precondiciones, flujo normal ni poscondiciones aplicables.

---

# CU01 - Portal Web del Hospital

## Descripción
Este documento describe los pasos para que el usuario navegue en el portal web y visualice servicios, especialidades y opciones disponibles.

## Objetivo
Permitir al usuario explorar el portafolio de servicios y acceder a funcionalidades públicas del hospital.

## Actores
- Usuario visitante
- Sistema informático

## Precondiciones
- El sitio web debe estar disponible.
- El usuario cuenta con navegador web compatible.

## Flujo normal básico
1. El usuario ingresa al portal web del hospital.
2. El sistema muestra la página de inicio con menú principal y buscador (RN01, RN02).
3. El usuario navega por las secciones: Servicios, Especialidades, Médicos, Contacto.
4. El usuario utiliza el buscador para encontrar un servicio o médico específico (RN03).
5. El sistema muestra resultados y fichas detalladas de servicios.
6. El usuario puede iniciar proceso de registro o reservar una consulta redirigiéndose a los módulos correspondientes.
7. Fin del caso de uso.

## Flujos alternos
### FA01 - Búsqueda sin resultados
1. El sistema no encuentra coincidencias.
2. El sistema sugiere términos alternativos y muestra vías de contacto.

### FA02 - Error de conectividad
1. El sistema no puede cargar contenido dinámico.
2. Se muestra mensaje de indisponibilidad temporal.

## Poscondiciones
- Se registran métricas de navegación para analítica.

## Reglas de negocio
- RN01: Disponibilidad de menú. El menú principal debe ser visible en todas las páginas.
- RN02: Accesibilidad. Cumplir pautas WCAG AA en navegación y contraste.
- RN03: Búsqueda. El buscador debe permitir búsqueda por nombre de médico, especialidad y servicio.

## Requerimientos suplementarios o no funcionales
- Disponibilidad 99.5% mensual.
- Tiempo de respuesta de la interfaz < 3s para operaciones estándar.
- Auditoría de acciones de usuario y trazabilidad de cambios.
- Cumplimiento de confidencialidad de datos de pacientes.

---

# CU02 - Registro de Paciente

## Descripción
Define los pasos para crear un registro de paciente en el sistema.

## Objetivo
Permitir el alta de pacientes con datos mínimos y validaciones básicas.

## Actores
- Paciente
- Recepcionista
- Sistema informático

## Precondiciones
- El usuario tiene permisos para registrar pacientes.
- El sistema está disponible.

## Flujo normal básico
1. El usuario accede al módulo de Registro de Pacientes.
2. El sistema muestra el formulario de registro con campos obligatorios (RN01-RN06).
3. El usuario ingresa datos personales: Nombres, Apellidos, DPI/NIT, Fecha de nacimiento, Teléfono, Email (RN02-RN06).
4. El usuario puede asociar información de seguro si aplica (RN07).
5. El usuario confirma y guarda.
6. El sistema valida los datos, crea el expediente y genera un número de paciente (RN01-RN07).
7. Fin del caso de uso.

## Flujos alternos
### FA01 - Documento de identidad duplicado
1. El sistema detecta DPI/NIT ya registrado (RN03).
2. Se muestra mensaje y se ofrece ir a actualización de datos.

### FA02 - Email inválido
1. El sistema detecta formato inválido de correo (RN05).
2. Se solicita corrección al usuario.

## Poscondiciones
- Se crea expediente activo asociado al paciente.

## Reglas de negocio
- RN01: Campos obligatorios. Nombres, Apellidos, Documento de identidad, Fecha de nacimiento.
- RN02: Validación de nombre. Permite de 2 a 100 caracteres alfabéticos y espacios.
- RN03: Unicidad de DPI/NIT. No se permite duplicar documento de identidad.
- RN04: Teléfono. Solo números, 8 a 15 dígitos.
- RN05: Email. Debe cumplir formato de correo electrónico válido.
- RN06: Consentimiento. Debe aceptarse aviso de privacidad para finalizar.
- RN07: Seguro. Si el paciente declara seguro, registrar aseguradora y número de póliza.

## Requerimientos suplementarios o no funcionales
- Disponibilidad 99.5% mensual.
- Tiempo de respuesta de la interfaz < 3s para operaciones estándar.
- Auditoría de acciones de usuario y trazabilidad de cambios.
- Cumplimiento de confidencialidad de datos de pacientes.

---

# CU03 - Mantenimiento de Usuarios

## Descripción
Describe la administración de cuentas de usuario, roles y estados.

## Objetivo
Permitir crear, editar, desactivar y asignar roles a usuarios del sistema.

## Actores
- Administrador
- Sistema informático

## Precondiciones
- El administrador ha iniciado sesión con permisos de seguridad adecuados.

## Flujo normal básico
1. El administrador accede al módulo de Usuarios.
2. El sistema muestra listado con filtros y acciones (RN01-RN03).
3. El administrador selecciona Crear Usuario o edita uno existente.
4. El sistema muestra formulario con datos básicos y roles (RN02-RN05).
5. El administrador guarda los cambios.
6. El sistema valida y aplica políticas de contraseñas y roles (RN04-RN06).
7. Fin del caso de uso.

## Flujos alternos
### FA01 - Intento de asignar rol incompatible
1. El sistema detecta conflicto de roles (RN05).
2. Se muestra mensaje y se bloquea la asignación.

### FA02 - Usuario duplicado
1. Se detecta correo corporativo ya registrado (RN01).
2. Se ofrece recuperación de acceso.

## Poscondiciones
- Queda registrada la auditoría de cambios.

## Reglas de negocio
- RN01: Unicidad de usuario. El email de usuario debe ser único.
- RN02: Estados de usuario. Activo, Bloqueado, Deshabilitado.
- RN03: Listado y filtros. Permite filtrar por rol, estado y nombre.
- RN04: Política de contraseñas. Mínimo 8 caracteres, mayúscula, minúscula y número.
- RN05: Compatibilidad de roles. No permitir mezcla de roles conflictivos, por ejemplo Auditor y Operador con privilegios de edición crítica.
- RN06: MFA opcional. Permitir habilitar autenticación de dos factores.

## Requerimientos suplementarios o no funcionales
- Disponibilidad 99.5% mensual.
- Tiempo de respuesta de la interfaz < 3s para operaciones estándar.
- Auditoría de acciones de usuario y trazabilidad de cambios.
- Cumplimiento de confidencialidad de datos de pacientes.

---

# CU04 - Mantenimiento de Consultas / Citas

## Descripción
Gestión de agenda de consultas médicas: crear, reprogramar, cancelar.

## Objetivo
Administrar el ciclo de vida de citas médicas evitando conflictos de agenda.

## Actores
- Recepcionista
- Paciente
- Médico
- Sistema informático

## Precondiciones
- El paciente existe y está activo.
- El médico tiene agenda configurada.

## Flujo normal básico
1. El usuario accede al módulo de Consultas.
2. El sistema muestra la agenda por médico y calendario (RN01-RN03).
3. El usuario registra nueva cita seleccionando paciente, médico, fecha y hora (RN02-RN04).
4. El sistema valida disponibilidad y conflictos (RN03).
5. El usuario confirma y guarda.
6. El sistema notifica al paciente por email/SMS si está configurado (RN05).
7. Fin del caso de uso.

## Flujos alternos
### FA01 - Conflicto de horario
1. El sistema detecta solapamiento de cita (RN03).
2. Se solicita seleccionar otra franja.

### FA02 - Médico no disponible
1. Bloqueo en agenda o vacaciones.
2. Se ofrece médicos alternativos o fechas próximas.

## Poscondiciones
- La cita queda registrada y visible en la agenda.

## Reglas de negocio
- RN01: Vista de agenda. Permitir vista diaria, semanal y por médico.
- RN02: Campos obligatorios de cita. Paciente, Médico, Fecha, Hora, Motivo opcional.
- RN03: Validación de disponibilidad. No permitir solapamientos para el mismo médico y sala.
- RN04: Tiempo mínimo. Duración predeterminada de 20 a 60 minutos según especialidad.
- RN05: Notificaciones. Enviar recordatorios con 24h de anticipación cuando esté habilitado.

## Requerimientos suplementarios o no funcionales
- Disponibilidad 99.5% mensual.
- Tiempo de respuesta de la interfaz < 3s para operaciones estándar.
- Auditoría de acciones de usuario y trazabilidad de cambios.
- Cumplimiento de confidencialidad de datos de pacientes.

---

# CU05 - Reglas de Negocio Consolidado

## Descripción
Documento que consolida reglas de negocio aplicables a múltiples módulos del hospital.

## Objetivo
Centralizar y estandarizar reglas comunes para reutilización y control.

## Actores
- N/A

## Precondiciones
- N/A

## Flujo normal básico
- N/A

## Flujos alternos
- N/A

## Poscondiciones
- N/A

## Reglas de negocio
- RN01: Formato de correo. Debe cumplir RFC básico usuario@dominio.
- RN02: Teléfono. Solo dígitos, longitud 8-15, opcional +prefijo.
- RN03: Identificación única. DPI/NIT único por paciente.
- RN04: Trazabilidad. Registrar usuario, fecha y operación en auditoría.
- RN05: RBAC. Acceso basado en roles para módulos críticos.
- RN06: Seguro. Validar póliza activa y cobertura antes de aplicar descuento.
- RN07: Descuentos. Si paciente tiene seguro activo, aplicar porcentaje de cobertura definido por convenio.

## Requerimientos suplementarios o no funcionales
- Disponibilidad 99.5% mensual.
- Tiempo de respuesta de la interfaz < 3s para operaciones estándar.
- Auditoría de acciones de usuario y trazabilidad de cambios.
- Cumplimiento de confidencialidad de datos de pacientes.

---

# CU06 - Muestras Médicas

## Descripción
Creación y registro de solicitudes de muestras médicas para análisis.

## Objetivo
Permitir solicitar, identificar y enviar muestras al laboratorio.

## Actores
- Usuario
- Sistema informático

## Precondiciones
- El sistema debe estar disponible.

## Flujo normal básico
1. El usuario accede a Muestras Médicas.
2. El sistema muestra formulario de solicitud con campos Tipo solicitante, Tipo de solicitud, Descripción, No. de expediente (RN01-RN05).
3. El usuario ingresa datos y solicita búsqueda del expediente.
4. El sistema valida y muestra datos del expediente (RN03, RN04).
5. El usuario confirma y envía la solicitud.
6. El sistema crea la solicitud y muestra el número asignado.
7. Fin del caso de uso.

## Flujos alternos
### FA01 - Tipo de solicitante externo
1. El usuario selecciona solicitante externo.
2. Se piden datos adicionales de soporte o factura en caso de corresponder (RN06-RN08).

### FA02 - Expediente no existe
1. El sistema no encuentra el expediente.
2. Se muestra mensaje y se detiene el proceso.

## Poscondiciones
- Solicitud creada y lista para laboratorio.

## Reglas de negocio
- RN01: Tipo solicitante. IN-Interno, EX-Externo, selección obligatoria.
- RN02: Tipo solicitud. Valores: MM-Muestra Médica, LQ-Laboratorio.
- RN03: Número de expediente. Formato AAAA-MM-DD-CC-NNNNNNN, con 7 a 10 dígitos finales.
- RN04: Descripción. Obligatoria, 10 a 2000 caracteres.
- RN05: Validación de campos. Todos los campos obligatorios deben completarse correctamente.
- RN06: Tipo soporte. Catálogo Interno/Externo según políticas.
- RN07: Número soporte. Hasta 50 caracteres alfanuméricos.
- RN08: Contacto. Teléfono 8 dígitos, email válido.

## Requerimientos suplementarios o no funcionales
- Disponibilidad 99.5% mensual.
- Tiempo de respuesta de la interfaz < 3s para operaciones estándar.
- Auditoría de acciones de usuario y trazabilidad de cambios.
- Cumplimiento de confidencialidad de datos de pacientes.

---

# CU07 - Laboratorio

## Descripción
Procesamiento de solicitudes de laboratorio y registro de resultados.

## Objetivo
Gestionar el flujo desde recepción de muestra hasta emisión de resultados.

## Actores
- Técnico de laboratorio
- Médico
- Sistema informático

## Precondiciones
- Existe una solicitud de muestra asociada y la muestra ha sido recibida.

## Flujo normal básico
1. El técnico ingresa al módulo de Laboratorio.
2. El sistema lista solicitudes pendientes con estado y prioridad (RN01-RN02).
3. El técnico selecciona una solicitud y registra recepción de muestra.
4. El sistema permite capturar resultados y adjuntar archivos si aplica (RN03).
5. El técnico finaliza el análisis y guarda.
6. El sistema cambia el estado a Completado y notifica al médico/área solicitante (RN04).
7. Fin del caso de uso.

## Flujos alternos
### FA01 - Muestra dañada o insuficiente
1. El técnico marca incidencia.
2. El sistema reprograma o solicita nueva toma de muestra.

## Poscondiciones
- Resultados disponibles para consulta autorizada.

## Reglas de negocio
- RN01: Estados. Pendiente, En proceso, Completado, Rechazado.
- RN02: Trazabilidad. Registrar usuario, fecha/hora de cada cambio de estado.
- RN03: Adjuntos. Permitir PDF/imagen hasta 10MB por archivo.
- RN04: Notificaciones. Notificar al creador de la solicitud al completar resultados.

## Requerimientos suplementarios o no funcionales
- Disponibilidad 99.5% mensual.
- Tiempo de respuesta de la interfaz < 3s para operaciones estándar.
- Auditoría de acciones de usuario y trazabilidad de cambios.
- Cumplimiento de confidencialidad de datos de pacientes.

---

# CU08 - Reportes

## Descripción
Generación de reportes operativos y administrativos.

## Objetivo
Permitir a los usuarios generar reportes con filtros definidos.

## Actores
- Analista
- Administrador
- Sistema informático

## Precondiciones
- El usuario tiene permisos de acceso al módulo de reportes.

## Flujo normal básico
1. El usuario accede al módulo de Reportes.
2. El sistema muestra catálogo de reportes y filtros disponibles (RN01).
3. El usuario selecciona un reporte, define filtros y ejecuta.
4. El sistema genera el reporte y permite exportarlo a PDF/Excel (RN02).
5. Fin del caso de uso.

## Flujos alternos
### FA01 - Rango de fechas inválido
1. El sistema detecta rango inválido (RN03).
2. Solicita corrección.

## Poscondiciones
- Reporte disponible y registradas métricas de uso.

## Reglas de negocio
- RN01: Catálogo de reportes. Acceso según rol y área.
- RN02: Exportación. Permitir exportar a PDF y Excel.
- RN03: Validación de filtros. Validar rangos de fecha y parámetros obligatorios.

## Requerimientos suplementarios o no funcionales
- Disponibilidad 99.5% mensual.
- Tiempo de respuesta de la interfaz < 3s para operaciones estándar.
- Auditoría de acciones de usuario y trazabilidad de cambios.
- Cumplimiento de confidencialidad de datos de pacientes.

---

# CU09 - Pagos y Seguros

## Descripción
Cobro de servicios con validación simple de seguro para aplicar descuentos.

## Objetivo
Procesar pagos verificando si el paciente tiene seguro activo y aplicar el descuento correspondiente.

## Actores
- Cajero
- Paciente
- Sistema informático

## Precondiciones
- Existe una orden/servicio a cobrar.
- El paciente está identificado.

## Flujo normal básico
1. El cajero abre el módulo de Pagos e ingresa el identificador de la orden.
2. El sistema muestra el detalle y total a pagar (RN01).
3. El sistema verifica si el paciente tiene seguro activo (RN02).
4. Si tiene seguro, aplica el porcentaje de cobertura/descuento (RN03).
5. El cajero confirma el medio de pago y registra la transacción.
6. El sistema emite recibo y actualiza el estado de la orden.
7. Fin del caso de uso.

## Flujos alternos
### FA01 - Seguro no válido o vencido
1. El sistema detecta póliza inactiva (RN02).
2. Se cobra sin descuento o se solicita otro medio de pago.

### FA02 - Monto cero tras cobertura total
1. El sistema detecta cobertura 100%.
2. Se emite recibo por valor $0 y se cierra la orden.

## Poscondiciones
- Transacción registrada y recibo emitido.

## Reglas de negocio
- RN01: Detalle de cobro. Mostrar conceptos, cantidades y precios.
- RN02: Validación de seguro. Verificar póliza activa y cobertura aplicable al servicio.
- RN03: Aplicación de descuento. Aplicar porcentaje de cobertura al subtotal; calcular copago si aplica.
- RN04: Medios de pago. Efectivo, tarjeta, transferencia.

## Requerimientos suplementarios o no funcionales
- Disponibilidad 99.5% mensual.
- Tiempo de respuesta de la interfaz < 3s para operaciones estándar.
- Auditoría de acciones de usuario y trazabilidad de cambios.
- Cumplimiento de confidencialidad de datos de pacientes.

---

# CU10 - Atención de Emergencias y Triage

## Descripción
Recepción y clasificación de pacientes en emergencia mediante triage.

## Objetivo
Priorizar la atención según severidad y registrar la atención inicial.

## Actores
- Enfermería de triage
- Médico de guardia
- Paciente
- Sistema informático

## Precondiciones
- El servicio de emergencias está operativo.

## Flujo normal básico
1. El paciente ingresa a emergencias.
2. El personal de triage registra signos vitales y síntomas (RN01).
3. El sistema asigna categoría de prioridad (RN02).
4. Se asigna sala o médico según prioridad y disponibilidad (RN03).
5. Se registra atención inicial y órdenes si aplica.
6. Fin del caso de uso.

## Flujos alternos
### FA01 - Paro cardiorrespiratorio
1. Se clasifica automáticamente como máxima prioridad.
2. Se activa protocolo de reanimación.

## Poscondiciones
- Paciente queda en lista de atención o trasladado a sala crítica.

## Reglas de negocio
- RN01: Datos mínimos de triage. Frecuencia cardiaca, respiratoria, presión arterial, saturación O2, temperatura, dolor 0-10.
- RN02: Categorías de prioridad. I-Crítico, II-Urgente, III-Prioritario, IV-No urgente.
- RN03: Tiempo objetivo de atención. Categoría I: inmediato; II: <15 min; III: <60 min; IV: <120 min.

## Requerimientos suplementarios o no funcionales
- Disponibilidad 99.5% mensual.
- Tiempo de respuesta de la interfaz < 3s para operaciones estándar.
- Auditoría de acciones de usuario y trazabilidad de cambios.
- Cumplimiento de confidencialidad de datos de pacientes.

---

# CU11 - Admisión de Paciente

## Descripción
Gestiona el ingreso administrativo del paciente al hospital, validando si su atención procederá mediante seguro activo o pago en sitio.

## Objetivo
Permitir la admisión formal del paciente para consulta, emergencia u hospitalización, asegurando el cumplimiento de validaciones administrativas y financieras previas.

## Actores
- Recepcionista
- Paciente
- Sistema informático

## Precondiciones
- El paciente debe estar registrado o identificado en el sistema.
- El servicio hospitalario debe estar operativo.

## Flujo normal básico
1. El recepcionista accede al módulo de Admisión.
2. El sistema solicita búsqueda del paciente por expediente, DPI/NIT o nombre.
3. El recepcionista selecciona al paciente e indica tipo de ingreso: consulta, emergencia u hospitalización (RN01).
4. El sistema muestra datos del paciente y solicita validación financiera (RN02).
5. El sistema verifica si el paciente tiene seguro activo y cobertura aplicable, o si realizará pago en sitio (RN03-RN04).
6. Si la validación es correcta, el recepcionista confirma la admisión.
7. El sistema registra la admisión, genera el número de ingreso y habilita la atención correspondiente.
8. Fin del caso de uso.

## Flujos alternos
### FA01 - Paciente no registrado
1. El sistema no encuentra expediente del paciente.
2. Se solicita realizar primero el Registro de Paciente.

### FA02 - Seguro no válido
1. El sistema detecta póliza inactiva, vencida o sin cobertura aplicable.
2. Se solicita pago en sitio para continuar con la admisión.

### FA03 - Sin seguro ni pago garantizado
1. El sistema detecta que no existe seguro válido ni confirmación de pago.
2. Se bloquea la admisión administrativa.

## Poscondiciones
- La admisión queda registrada y el paciente queda habilitado para el flujo asistencial correspondiente.

## Reglas de negocio
- RN01: Tipo de ingreso. Valores permitidos: Consulta, Emergencia, Hospitalización.
- RN02: Identificación del paciente. La admisión solo puede realizarse con paciente identificado en el sistema.
- RN03: Validación de seguro. Verificar póliza activa y cobertura antes de confirmar la admisión.
- RN04: Validación de pago. Si no existe seguro válido, debe registrarse compromiso de pago o pago en sitio.
- RN05: Bloqueo administrativo. No permitir admisión si no existe seguro válido ni pago garantizado.
- RN06: Trazabilidad. Registrar usuario, fecha y hora de la admisión.

## Requerimientos suplementarios o no funcionales
- Disponibilidad 99.5% mensual.
- Tiempo de respuesta de la interfaz < 3s para operaciones estándar.
- Auditoría de acciones de usuario y trazabilidad de cambios.
- Cumplimiento de confidencialidad de datos de pacientes.

---

# CU12 - Atención Médica

## Descripción
Gestiona la atención médica del paciente una vez validado su ingreso, permitiendo registrar evaluación clínica, diagnóstico y órdenes médicas.

## Objetivo
Permitir al médico documentar la consulta o atención del paciente y generar indicaciones hacia otros módulos del sistema.

## Actores
- Médico
- Paciente
- Sistema informático

## Precondiciones
- El paciente debe estar admitido o contar con cita activa.
- El médico debe tener permisos de acceso al expediente clínico.

## Flujo normal básico
1. El médico accede al módulo de Atención Médica.
2. El sistema muestra la lista de pacientes asignados o en atención.
3. El médico selecciona un paciente y consulta su expediente clínico.
4. El sistema muestra antecedentes, motivo de consulta y datos relevantes (RN01).
5. El médico registra evaluación clínica, signos, diagnóstico presuntivo o definitivo e indicaciones (RN02-RN03).
6. El médico puede generar órdenes de laboratorio, imágenes, farmacia u hospitalización según corresponda (RN04).
7. El médico guarda la atención realizada.
8. El sistema actualiza el expediente clínico y deja disponibles las órdenes generadas.
9. Fin del caso de uso.

## Flujos alternos
### FA01 - Paciente sin admisión válida
1. El sistema detecta que el paciente no tiene ingreso válido o cita activa.
2. Se bloquea el inicio de la atención.

### FA02 - Solicitud de exámenes complementarios
1. El médico requiere estudios adicionales.
2. El sistema genera orden hacia laboratorio o imágenes y deja la atención en seguimiento.

### FA03 - Requiere medicación
1. El médico prescribe tratamiento.
2. El sistema genera orden electrónica para farmacia.

## Poscondiciones
- La atención médica queda registrada en el expediente y las órdenes complementarias quedan disponibles para ejecución.

## Reglas de negocio
- RN01: Acceso al expediente. Solo personal autorizado puede consultar información clínica del paciente.
- RN02: Datos mínimos de atención. Deben registrarse motivo de consulta, evaluación clínica y diagnóstico o impresión diagnóstica.
- RN03: Integridad clínica. No se permite cerrar la atención sin registrar información mínima obligatoria.
- RN04: Órdenes médicas. Las órdenes deben quedar asociadas al episodio de atención del paciente.
- RN05: Auditoría clínica. Registrar médico tratante, fecha y hora de la atención.

## Requerimientos suplementarios o no funcionales
- Disponibilidad 99.5% mensual.
- Tiempo de respuesta de la interfaz < 3s para operaciones estándar.
- Auditoría de acciones de usuario y trazabilidad de cambios.
- Cumplimiento de confidencialidad de datos de pacientes.

---

# CU13 - Farmacia e Inventario

## Descripción
Gestiona el despacho de medicamentos y el control básico del inventario hospitalario.

## Objetivo
Permitir la entrega de medicamentos con base en una orden médica válida, descontando existencias y generando alertas de stock bajo.

## Actores
- Farmacéutico
- Médico
- Sistema informático

## Precondiciones
- Debe existir una orden médica activa.
- El medicamento debe estar registrado en inventario.

## Flujo normal básico
1. El farmacéutico accede al módulo de Farmacia.
2. El sistema muestra órdenes médicas pendientes de despacho.
3. El farmacéutico selecciona la orden y consulta los medicamentos requeridos (RN01).
4. El sistema valida existencia disponible para cada medicamento (RN02).
5. El farmacéutico confirma el despacho.
6. El sistema descuenta las cantidades entregadas del inventario y actualiza la orden a estado despachada (RN03).
7. Si el stock queda por debajo del mínimo definido, el sistema genera alerta de stock bajo (RN04).
8. Fin del caso de uso.

## Flujos alternos
### FA01 - Stock insuficiente
1. El sistema detecta que la cantidad disponible no cubre lo solicitado.
2. Se informa al usuario y se registra despacho parcial o pendiente según política interna.

### FA02 - Orden no válida
1. El sistema detecta orden anulada, vencida o ya despachada.
2. Se bloquea el despacho.

### FA03 - Reabastecimiento
1. El usuario registra ingreso de medicamentos al inventario.
2. El sistema incrementa existencias del producto correspondiente.

## Poscondiciones
- La entrega del medicamento queda registrada y el inventario actualizado.

## Reglas de negocio
- RN01: Orden médica obligatoria. Solo se podrán despachar medicamentos con orden médica activa.
- RN02: Control de existencias. Validar cantidad disponible antes de confirmar el despacho.
- RN03: Actualización de inventario. Cada despacho reduce existencias; cada abastecimiento incrementa existencias.
- RN04: Stock mínimo. Generar alerta cuando la existencia esté igual o por debajo del nivel mínimo configurado.
- RN05: Trazabilidad. Registrar usuario, medicamento, cantidad, fecha y hora del movimiento.

## Requerimientos suplementarios o no funcionales
- Disponibilidad 99.5% mensual.
- Tiempo de respuesta de la interfaz < 3s para operaciones estándar.
- Auditoría de acciones de usuario y trazabilidad de cambios.
- Cumplimiento de confidencialidad de datos de pacientes.

---

# CU14 - Gestión de Horarios y Asistencia

## Descripción
Administra los horarios y el control de asistencia del personal médico, de enfermería y administrativo.

## Objetivo
Permitir registrar turnos, disponibilidad y asistencia del personal para apoyar la operación hospitalaria.

## Actores
- Encargado de Recursos Humanos
- Supervisor
- Sistema informático

## Precondiciones
- El personal debe estar registrado y activo en el sistema.

## Flujo normal básico
1. El usuario accede al módulo de Recursos Humanos.
2. El sistema muestra el listado de personal con filtros por área, cargo y estado (RN01).
3. El usuario selecciona un colaborador y registra o actualiza su horario de trabajo (RN02).
4. El sistema guarda la disponibilidad del personal para consulta operativa.
5. El usuario registra asistencia, ausencia o incidencia del turno (RN03).
6. El sistema actualiza el estado del personal y deja disponible la información para consulta administrativa.
7. Fin del caso de uso.

## Flujos alternos
### FA01 - Horario traslapado
1. El sistema detecta conflicto entre turnos asignados.
2. Solicita corrección antes de guardar.

### FA02 - Personal inactivo
1. El sistema detecta que el colaborador está deshabilitado.
2. No permite asignar nuevos horarios.

## Poscondiciones
- La disponibilidad y asistencia del personal quedan actualizadas.

## Reglas de negocio
- RN01: Filtros de personal. Permitir búsqueda por nombre, cargo, área y estado.
- RN02: Registro de horario. Todo horario debe incluir día, hora de inicio, hora de fin y área asignada.
- RN03: Estados de asistencia. Presente, Ausente, Permiso, Vacaciones.
- RN04: Validación de conflicto. No permitir traslapes de horario para el mismo colaborador.
- RN05: Disponibilidad operativa. La agenda médica solo debe considerar personal con horario activo.

## Requerimientos suplementarios o no funcionales
- Disponibilidad 99.5% mensual.
- Tiempo de respuesta de la interfaz < 3s para operaciones estándar.
- Auditoría de acciones de usuario y trazabilidad de cambios.
- Cumplimiento de confidencialidad de datos de pacientes.

---

# Matriz resumida de cobertura documental

| CU | Caso de uso | Fuente Word principal | Observación para Cursor |
|---|---|---|---|
| CU01 | Portal Web del Hospital | CU01_Portal_Web.docx | Incluye menú, buscador, servicios, especialidades, médicos, contacto, registro/reserva por redirección. |
| CU02 | Registro de Paciente | CU02_Registro_de_Paciente.docx | Incluye datos mínimos, consentimiento y seguro opcional. |
| CU03 | Mantenimiento de Usuarios | CU03_Mantenimiento_de_Usuarios.docx | Incluye usuarios, roles, estados, política de contraseña y MFA opcional. |
| CU04 | Mantenimiento de Consultas / Citas | CU04_Mantenimiento_de_Consultas.docx | Incluye agenda, disponibilidad, conflictos y notificaciones. |
| CU05 | Reglas de Negocio Consolidado | CU05_Reglas_de_Negocio.docx | Documento transversal de reglas; no es flujo operativo. |
| CU06 | Muestras Médicas | CU06_Muestras_Medicas.docx | Incluye solicitud, expediente, solicitante interno/externo y soporte. |
| CU07 | Laboratorio | CU07_Laboratorio.docx | Incluye recepción, resultados, adjuntos y notificación. |
| CU08 | Reportes | CU08_Reportes.docx | Incluye catálogo, filtros y exportación PDF/Excel. |
| CU09 | Pagos y Seguros | CU09_Pagos_y_Seguros.docx | Incluye validación de seguro, descuentos, copago y medios de pago. |
| CU10 | Atención de Emergencias y Triage | CU10_Emergencias_y_Triage.docx | Incluye signos vitales, prioridad y tiempo objetivo. |
| CU11 | Admisión de Paciente | CU11_Admisión_de_Paciente.docx | Incluye validación financiera previa a la admisión. |
| CU12 | Atención Médica | CU12_Atención_Médica.docx | Incluye expediente, evaluación, diagnóstico y órdenes. |
| CU13 | Farmacia e Inventario | CU13_Farmacia_e_Inventario.docx | El flujo oficial inicia desde órdenes médicas pendientes de despacho. |
| CU14 | Gestión de Horarios y Asistencia | CU14_Gestión_de_Horarios_y_Asistencia.docx | Incluye horarios, asistencia, conflictos y personal activo. |

# Instrucción sugerida para Cursor

Utilizar este archivo como fuente funcional consolidada. Comparar la implementación actual del backend y frontend contra cada CU. Para cada caso de uso, clasificar el estado como Completo, Parcial, No implementado o Fuera de alcance documentado. No agregar funcionalidades no descritas aquí sin registrarlas como propuesta separada. Priorizar brechas donde el sistema actual contradiga flujos normales, flujos alternos o reglas de negocio de los documentos Word.
