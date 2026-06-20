import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  AlignmentType,
  PageBreak,
} from 'docx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '../../docs/documentacion_final');

const PROJECT = 'Sistema Hospitalario Privado Hospital H&H';
const VERSION = '1.0';
const DATE = 'Mayo 2026';

function h1(t) {
  return new Paragraph({ text: t, heading: HeadingLevel.HEADING_1, spacing: { after: 200 } });
}
function h2(t) {
  return new Paragraph({ text: t, heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } });
}
function h3(t) {
  return new Paragraph({ text: t, heading: HeadingLevel.HEADING_3, spacing: { before: 180, after: 80 } });
}
function p(t) {
  return new Paragraph({ children: [new TextRun(t)], spacing: { after: 120 } });
}
function bullet(t) {
  return new Paragraph({ text: t, bullet: { level: 0 }, spacing: { after: 60 } });
}
function mono(t) {
  return new Paragraph({
    children: [new TextRun({ text: t, font: 'Consolas', size: 20 })],
    spacing: { after: 80 },
  });
}
function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}
function cover(title, subtitle) {
  return [
    new Paragraph({ spacing: { before: 1200 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: PROJECT, bold: true, size: 36 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 200 },
      children: [new TextRun({ text: title, bold: true, size: 48 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: subtitle, size: 28, italics: true })],
    }),
    new Paragraph({ spacing: { before: 800 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: `Versión ${VERSION}`, size: 24 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: DATE, size: 24 })],
    }),
    pageBreak(),
  ];
}
function tbl(headers, rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: headers.map(
          (h) =>
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
              shading: { fill: 'D9E2F3', type: ShadingType.CLEAR },
            }),
        ),
      }),
      ...rows.map(
        (r) =>
          new TableRow({
            children: r.map((c) => new TableCell({ children: [new Paragraph(String(c))] })),
          }),
      ),
    ],
  });
}
function diagramBlock(title, lines) {
  return [
    h3(title),
    ...lines.map((l) => mono(l)),
    p(''),
  ];
}

async function writeDoc(filename, children) {
  const doc = new Document({ creator: 'Hospital H&H', title: filename, sections: [{ children }] });
  fs.writeFileSync(path.join(OUT_DIR, filename), await Packer.toBuffer(doc));
  console.log('OK', filename);
}

// ─────────────────────────────────────────────────────────────
// 1. MANUAL DE USUARIO
// ─────────────────────────────────────────────────────────────
async function gen01() {
  await writeDoc('01_manual_usuario.docx', [
    ...cover('Manual de Usuario', 'Guía operativa del sistema intranet'),
    h1('1. Introducción'),
    p('El presente manual describe el uso funcional del sistema hospitalario privado Hospital H&H. El software gestiona el ciclo asistencial y administrativo: pacientes, agenda, admisiones, atenciones clínicas, órdenes, laboratorio, imagenología, farmacia, pagos y reportes.'),
    p('El acceso se realiza mediante navegador web con credenciales institucionales. Cada usuario visualiza únicamente los módulos autorizados según su rol asignado.'),
    h1('2. Acceso al sistema'),
    h2('2.1 Portal público'),
    p('La URL pública ofrece información institucional. Desde Acceso se redirige al formulario de inicio de sesión del personal autorizado.'),
    h2('2.2 Intranet'),
    bullet('Ingresar usuario y contraseña en la pantalla de acceso.'),
    bullet('Tras autenticación exitosa, el sistema muestra el menú lateral según el rol.'),
    bullet('Para operar con otro perfil, cerrar sesión e ingresar con credenciales distintas.'),
    h1('3. Roles y módulos'),
    tbl(
      ['Rol', 'Responsabilidad', 'Módulos principales'],
      [
        ['Recepcionista', 'Front office', 'Pacientes, Citas, Admisiones, Triage'],
        ['Médico', 'Atención clínica asignada', 'Atenciones, Órdenes, Lab, Imágenes'],
        ['Médico jefe', 'Supervisión y reasignación', 'Atenciones (todas), Órdenes'],
        ['Laboratorio', 'Estudios clínicos', 'Laboratorio'],
        ['Farmacia', 'Despacho e inventario', 'Medicamentos, Órdenes'],
        ['Cajero', 'Cobros', 'Pagos'],
        ['Administrador', 'Configuración global', 'Todos'],
        ['Auditor', 'Control ex post', 'Reportes, Bitácora'],
        ['RRHH', 'Recursos humanos', 'Personal, Especialidades'],
      ],
    ),
    p(''),
    h1('4. Procedimientos operativos'),
    h2('4.1 Pacientes y seguros'),
    bullet('Registrar expediente con DPI/NIT único y consentimiento de privacidad.'),
    bullet('Asociar pólizas con porcentaje de cobertura y vigencia.'),
    h2('4.2 Citas'),
    bullet('Agendar: paciente, médico, fecha/hora, motivo.'),
    bullet('Opción de envío de confirmación por correo al paciente.'),
    bullet('Estados: programada, reprogramada, cancelada, atendida, no asistió.'),
    h2('4.3 Admisiones'),
    bullet('Vincular paciente y cita opcional.'),
    bullet('Validación financiera: seguro vigente o pago en sitio.'),
    bullet('Al crear admisión en estado pendiente, admitido o transferido, se genera atención médica pendiente asignada al médico jefe.'),
    h2('4.4 Triage'),
    bullet('Aplica en ingresos de emergencia.'),
    bullet('Registrar signos vitales; la prioridad I–IV se calcula automáticamente.'),
    h2('4.5 Atenciones médicas'),
    bullet('El médico jefe visualiza todas las atenciones y reasigna al médico tratante.'),
    bullet('Completar motivo, evaluación, diagnóstico y plan de tratamiento.'),
    bullet('Checkboxes para solicitar laboratorio, imagen, farmacia u hospitalización.'),
    bullet('En edición: consultar órdenes y exámenes asociados desde listas interactivas.'),
    h2('4.6 Laboratorio e imágenes'),
    bullet('Registros generados automáticamente al crear órdenes correspondientes.'),
    bullet('Laboratorio: muestra, resultado, adjunto obligatorio al completar.'),
    h2('4.7 Farmacia y pagos'),
    bullet('Despacho de medicamentos con descuento de inventario.'),
    bullet('Registro de pagos con cobertura de seguro e impresión de comprobante PDF.'),
    h1('5. Flujos operativos'),
    h2('5.1 Consulta programada'),
    mono('Paciente → Seguro → Cita → Admisión → Atención → Órdenes → Estudios → Pago → Alta'),
    h2('5.2 Emergencia'),
    mono('Admisión emergencia → Triage → Atención → Órdenes → Estudios → Pago'),
  ]);
}

// ─────────────────────────────────────────────────────────────
// 2. HERRAMIENTAS UTILIZADAS
// ─────────────────────────────────────────────────────────────
async function gen02() {
  await writeDoc('02_herramientas_utilizadas.docx', [
    ...cover('Herramientas Utilizadas', 'Stack tecnológico del proyecto'),
    h1('1. Entorno de desarrollo'),
    tbl(
      ['Herramienta', 'Versión', 'Propósito'],
      [
        ['Java JDK', '17', 'Lenguaje backend'],
        ['Spring Boot', '3.4.4', 'Framework servidor'],
        ['Maven', '3.x', 'Gestión de dependencias backend'],
        ['Node.js', '22.x', 'Runtime frontend y herramientas'],
        ['Angular', '19.2.x', 'Framework SPA'],
        ['Angular Material', '19.2.x', 'Componentes UI'],
        ['TypeScript', '5.7.x', 'Lenguaje frontend'],
        ['PostgreSQL', '15', 'Motor relacional'],
        ['Git', '—', 'Control de versiones'],
        ['Visual Studio Code / Cursor', '—', 'IDE'],
      ],
    ),
    p(''),
    h1('2. Librerías backend'),
    tbl(
      ['Librería', 'Versión', 'Uso'],
      [
        ['Spring Web', '3.4.4', 'API REST'],
        ['Spring Data JPA', '3.4.4', 'Persistencia ORM'],
        ['Spring Security', '3.4.4', 'Autenticación JWT'],
        ['Spring Mail', '3.4.4', 'Notificaciones correo'],
        ['Spring Validation', '3.4.4', 'Validación Jakarta'],
        ['JJWT', '0.12.6', 'Tokens JWT'],
        ['Springdoc OpenAPI', '2.8.5', 'Documentación API (dev)'],
        ['Azure Blob Storage SDK', '12.29.0', 'Adjuntos en producción'],
        ['Lombok', '—', 'Reducción boilerplate'],
      ],
    ),
    p(''),
    h1('3. Librerías frontend'),
    tbl(
      ['Librería', 'Versión', 'Uso'],
      [
        ['RxJS', '7.8.x', 'Programación reactiva'],
        ['jsPDF', '4.2.x', 'Comprobantes PDF'],
        ['jsPDF-AutoTable', '5.0.x', 'Tablas en PDF'],
      ],
    ),
    p(''),
    h1('4. Herramientas de calidad'),
    bullet('JUnit 5 y Mockito: pruebas unitarias backend.'),
    bullet('Spring Boot Test: pruebas de integración.'),
    bullet('Angular CLI: compilación y empaquetado frontend.'),
    bullet('ESLint / compilador TypeScript: verificación estática frontend.'),
  ]);
}

// ─────────────────────────────────────────────────────────────
// 3. MANUAL TÉCNICO
// ─────────────────────────────────────────────────────────────
async function gen03() {
  await writeDoc('03_manual_tecnico.docx', [
    ...cover('Manual Técnico', 'Especificaciones de implementación'),
    h1('1. Descripción general'),
    p('El sistema es una aplicación monolítica de tres capas: cliente Angular SPA, API REST Spring Boot y base de datos PostgreSQL. La comunicación utiliza JSON sobre HTTP/HTTPS con autenticación Bearer JWT stateless.'),
    h1('2. Backend'),
    h2('2.1 Estructura de paquetes'),
    mono('com.hospital.{modulo}.{controller|service|repository|entity|dto}'),
    p('Módulos de dominio: admission, appointment, auth, auditlog, imaging, insurance, laboratory, medicalcare, medicalorder, medication, patient, payment, report, role, specialty, staff, triage, user.'),
    p('Paquetes transversales: config, exception, security, storage, mail.'),
    h2('2.2 API REST'),
    p('Prefijo base: /api. Puerto por defecto: 8080. Documentación en backend/doc/API.md.'),
    h2('2.3 Persistencia'),
    p('Esquema hospital en PostgreSQL. JPA con ddl-auto=validate. Entidades mapeadas a 15 tablas principales más líneas de orden farmacia.'),
    h2('2.4 Seguridad'),
    bullet('JWT HS256 con expiración configurable (120 min por defecto).'),
    bullet('Roles en token como ROLE_{NOMBRE}.'),
    bullet('Respuestas 401/403 unificadas en ApiErrorResponse.'),
    bullet('Auditoría de seguridad: login, acceso denegado, token inválido.'),
    h2('2.5 Reglas de negocio destacadas'),
    bullet('Admisión RECHAZADO/ANULADO bloquea triage, atenciones y pagos nuevos.'),
    bullet('Auto-atención al admitir: estados PENDIENTE, ADMITIDO, TRANSFERIDO.'),
    bullet('Médico jefe único resuelto por ChiefMedicalDoctorResolver.'),
    bullet('Orden LAB/IMAGEN auto-crea registro pendiente en laboratorio/imágenes.'),
    bullet('Laboratorio COMPLETADO exige adjunto válido.'),
    bullet('Correlativo lab: AAAA-MM-DD-CC-NNNNNNN vía LaboratoryRecordNumberGenerator.'),
    h1('3. Frontend'),
    h2('3.1 Estructura'),
    mono('src/app/{core|public|intranet|features/{modulo}}'),
    p('Guards: authGuard, roleGuard. Servicios HTTP por módulo. Componentes standalone Angular 19.'),
    h2('3.2 Entornos'),
    p('Desarrollo: apiUrl http://localhost:8080. Proxy en ng serve. Build producción en dist/hospital-web.'),
    h1('4. Almacenamiento de adjuntos'),
    p('Perfil local: filesystem en ./data/uploads. Perfil prod: Azure Blob Storage. Metadatos JSON en columna adjunto de laboratorio.'),
    h1('5. Correo electrónico'),
    p('SMTP Gmail puerto 587. Envío asíncrono post-commit para citas. Configuración en application-local.yml o variables MAIL_*.'),
  ]);
}

// ─────────────────────────────────────────────────────────────
// 4. DIAGRAMA DE SECUENCIA
// ─────────────────────────────────────────────────────────────
async function gen04() {
  await writeDoc('04_diagrama_secuencia.docx', [
    ...cover('Diagrama de Secuencia', 'Flujos principales del sistema'),
    h1('1. Introducción'),
    p('Los diagramas de secuencia describen la interacción temporal entre actores y componentes del sistema en los flujos operativos principales.'),
    h1('2. Secuencia: Consulta programada completa'),
    ...diagramBlock('Actores: Recepcionista, Médico jefe, Médico, Laboratorio, Cajero', [
      'Recepcionista -> Frontend: Registrar paciente y seguro',
      'Frontend -> API: POST /api/patients, POST /api/patients/{id}/insurances',
      'Recepcionista -> Frontend: Crear cita',
      'Frontend -> API: POST /api/appointments [notifyEmail opcional]',
      'API -> SMTP: Enviar confirmación (asíncrono)',
      'Recepcionista -> Frontend: Crear admisión CONSULTA',
      'Frontend -> API: POST /api/admissions',
      'API -> BD: INSERT admisión',
      'API -> BD: INSERT atención pendiente (médico jefe)',
      'Médico jefe -> Frontend: Reasignar atención',
      'Frontend -> API: PUT /api/medical-cares/{id}',
      'Médico -> Frontend: Completar atención + órdenes',
      'Frontend -> API: PUT /api/medical-cares/{id}',
      'Frontend -> API: POST /api/medical-orders (LAB, etc.)',
      'API -> BD: INSERT laboratorio pendiente (si orden LAB)',
      'Laboratorio -> Frontend: Completar estudio + adjunto',
      'Frontend -> API: PUT /api/laboratory/{id}, POST attachment',
      'Cajero -> Frontend: Registrar pago',
      'Frontend -> API: POST /api/payments',
    ]),
    h1('3. Secuencia: Emergencia con triage'),
    ...diagramBlock('Actores: Recepcionista, Médico jefe, Médico', [
      'Recepcionista -> Frontend: Admisión EMERGENCIA',
      'Frontend -> API: POST /api/admissions',
      'API -> BD: Auto-atención médico jefe',
      'Recepcionista -> Frontend: Registrar triage',
      'Frontend: Calcular prioridad I-IV (signos vitales)',
      'Frontend -> API: POST /api/triage',
      'Médico jefe -> Frontend: Reasignar atención',
      'Médico -> Frontend: Atención + órdenes urgentes',
    ]),
    h1('4. Secuencia: Autenticación'),
    ...diagramBlock('Actores: Usuario, Frontend, API, BD', [
      'Usuario -> Frontend: Credenciales',
      'Frontend -> API: POST /api/auth/login',
      'API -> BD: Validar usuario activo',
      'API -> Frontend: accessToken + roles',
      'Frontend: Almacenar token, cargar menú por rol',
      'Frontend -> API: Requests con Authorization Bearer',
      'API: JwtAuthenticationFilter valida token',
    ]),
  ]);
}

// ─────────────────────────────────────────────────────────────
// 5. DIAGRAMA DE CLASES
// ─────────────────────────────────────────────────────────────
async function gen05() {
  await writeDoc('05_diagrama_clases.docx', [
    ...cover('Diagrama de Clases', 'Modelo de dominio principal'),
    h1('1. Entidades de persistencia'),
    p('Las entidades JPA representan el modelo relacional del hospital. Relaciones principales:'),
    tbl(
      ['Entidad', 'Tabla', 'Relaciones clave'],
      [
        ['Patient', 'pacientes', '1:N seguros, citas, admisiones, atenciones, pagos'],
        ['Staff', 'personal', 'N:1 usuario, especialidad; 1:N citas, atenciones'],
        ['Appointment', 'citas', 'N:1 paciente, médico, especialidad'],
        ['Admission', 'admisiones', 'N:1 paciente; 0:1 cita; 1:N triage'],
        ['Triage', 'triage', 'N:1 admisión'],
        ['MedicalCare', 'atenciones_medicas', 'N:1 paciente, admisión, cita, médico; 1:N órdenes'],
        ['MedicalOrder', 'ordenes_medicas', 'N:1 atención; 0:1 lab, imagen; 1:N líneas farmacia'],
        ['Laboratory', 'laboratorio', '1:1 orden médica LAB'],
        ['ImagingStudy', 'imagenes', '1:1 orden médica IMAGEN'],
        ['Payment', 'pagos', 'N:1 paciente, admisión, orden'],
        ['Medication', 'medicamentos', '1:N líneas farmacia'],
        ['AuditLog', 'bitacora', 'N:1 usuario'],
      ],
    ),
    p(''),
    h1('2. Capa de servicios (clases principales)'),
    tbl(
      ['Servicio', 'Responsabilidad'],
      [
        ['AdmissionService', 'CRUD admisiones, validación financiera, auto-atención'],
        ['AppointmentService', 'Agenda, solapamiento, eventos correo'],
        ['MedicalCareService', 'Atenciones, filtro por rol, reasignación jefe'],
        ['MedicalOrderService', 'Órdenes, fulfillment lab/imagen, stock farmacia'],
        ['LaboratoryService', 'Estudios, adjuntos, correlativo expediente'],
        ['ImagingStudyService', 'Estudios radiológicos'],
        ['PaymentService', 'Cobros, totales, validación admisión'],
        ['TriageService', 'Clasificación urgencias'],
        ['ChiefMedicalDoctorResolver', 'Resolución médico jefe único'],
        ['MedicalCareAccessSupport', 'Visibilidad atenciones por rol'],
      ],
    ),
    p(''),
    h1('3. DTOs y controladores'),
    p('Cada módulo expone records Java (CreateRequest, UpdateRequest, Response) validados con Jakarta Validation. Los controladores REST delegan en servicios y retornan JSON.'),
    h1('4. Representación UML simplificada'),
    ...diagramBlock('Asociaciones centrales', [
      'Patient "1" -- "*" Admission',
      'Patient "1" -- "*" MedicalCare',
      'Admission "1" -- "0..1" Appointment',
      'Admission "1" -- "*" Triage',
      'MedicalCare "1" -- "*" MedicalOrder',
      'MedicalOrder "1" -- "0..1" Laboratory',
      'MedicalOrder "1" -- "0..1" ImagingStudy',
      'MedicalOrder "1" -- "*" PharmacyOrderLine',
    ]),
  ]);
}

// ─────────────────────────────────────────────────────────────
// 6. ESTRUCTURA DE MÓDULOS
// ─────────────────────────────────────────────────────────────
async function gen06() {
  await writeDoc('06_estructura_modulos.docx', [
    ...cover('Estructura de Módulos', 'Organización funcional del sistema'),
    h1('1. Módulos funcionales'),
    tbl(
      ['Módulo', 'Backend', 'Frontend', 'Descripción'],
      [
        ['Autenticación', 'auth', 'core/auth', 'Login JWT, guards'],
        ['Pacientes', 'patient', 'features/patients', 'Expedientes y seguros'],
        ['Citas', 'appointment', 'features/appointments', 'Agenda médica'],
        ['Admisiones', 'admission', 'features/admissions', 'Ingreso hospitalario'],
        ['Triage', 'triage', 'features/triage', 'Clasificación urgencias'],
        ['Atenciones', 'medicalcare', 'features/medical-cares', 'Consultas clínicas'],
        ['Órdenes', 'medicalorder', 'features/medical-orders', 'Prescripciones y solicitudes'],
        ['Laboratorio', 'laboratory', 'features/laboratory', 'Estudios clínicos'],
        ['Imágenes', 'imaging', 'features/imaging', 'Radiología'],
        ['Medicamentos', 'medication', 'features/medications', 'Inventario farmacia'],
        ['Pagos', 'payment', 'features/payments', 'Caja y cobros'],
        ['Reportes', 'report', 'features/reports', 'Informes operativos'],
        ['Bitácora', 'auditlog', 'features/audit-logs', 'Auditoría'],
        ['Usuarios/Roles', 'user, role', 'features/users, roles', 'Administración'],
        ['Personal', 'staff, specialty', 'features/staff, specialties', 'RRHH'],
        ['Portal', '—', 'public', 'Web informativa'],
      ],
    ),
    p(''),
    h1('2. Árbol backend'),
    ...diagramBlock('backend/src/main/java/com/hospital/', [
      '├── admission/',
      '├── appointment/',
      '├── auth/',
      '├── auditlog/',
      '├── config/',
      '├── exception/',
      '├── imaging/',
      '├── insurance/',
      '├── laboratory/',
      '├── mail/',
      '├── medicalcare/',
      '├── medicalorder/',
      '├── medication/',
      '├── patient/',
      '├── payment/',
      '├── report/',
      '├── role/',
      '├── security/',
      '├── specialty/',
      '├── staff/',
      '├── storage/',
      '├── triage/',
      '├── user/',
      '└── HospitalApplication.java',
    ]),
    h1('3. Árbol frontend'),
    ...diagramBlock('frontend/src/app/', [
      '├── core/          (auth, guards, menu, constants)',
      '├── public/        (portal, layout, login redirect)',
      '├── intranet/      (shell, rutas /app/*)',
      '└── features/      (un folder por módulo de negocio)',
    ]),
  ]);
}

// ─────────────────────────────────────────────────────────────
// 7. DIAGRAMA DE DESPLIEGUE
// ─────────────────────────────────────────────────────────────
async function gen07() {
  await writeDoc('07_diagrama_despliegue.docx', [
    ...cover('Diagrama de Despliegue', 'Infraestructura de ejecución'),
    h1('1. Entorno de desarrollo'),
    ...diagramBlock('Nodos', [
      '[Navegador] --HTTP:4200--> [Angular Dev Server (ng serve)]',
      '[Angular Dev Server] --HTTP:8080/proxy--> [Spring Boot :8080]',
      '[Spring Boot] --JDBC:5432--> [PostgreSQL local]',
      '[Spring Boot] --SMTP:587--> [Gmail SMTP]',
      '[Spring Boot] --filesystem--> [./data/uploads (adjuntos local)]',
    ]),
    h1('2. Entorno de producción (referencia)'),
    ...diagramBlock('Nodos', [
      '[Navegador cliente] --HTTPS--> [Servidor web estático / CDN]',
      '  Contenido: dist/hospital-web (Angular build)',
      '[Navegador/API client] --HTTPS--> [Servidor aplicaciones Spring Boot]',
      '[Spring Boot prod profile] --JDBC--> [PostgreSQL gestionado]',
      '[Spring Boot prod profile] --HTTPS--> [Azure Blob Storage]',
      '[Spring Boot] --SMTP:587--> [Gmail / relay corporativo]',
    ]),
    h1('3. Puertos y protocolos'),
    tbl(
      ['Componente', 'Puerto', 'Protocolo'],
      [
        ['Frontend dev', '4200', 'HTTP'],
        ['API REST', '8080', 'HTTP/HTTPS'],
        ['PostgreSQL', '5432', 'TCP/JDBC'],
        ['SMTP Gmail', '587', 'STARTTLS'],
        ['Actuator health', '8080/actuator/health', 'HTTP GET'],
      ],
    ),
    p(''),
    h1('4. Perfiles Spring'),
    tbl(
      ['Perfil', 'Archivo', 'Características'],
      [
        ['default', 'application.yml', 'Seguridad ON, storage local, mail deshabilitado'],
        ['local', 'application-local.yml', 'Credenciales Gmail (no versionado)'],
        ['dev', 'application-dev.yml', 'Seguridad OFF, Swagger ON'],
        ['prod', 'application-prod.yml', 'Azure Blob Storage'],
        ['test', 'application-test.yml', 'Pruebas automatizadas'],
      ],
    ),
  ]);
}

// ─────────────────────────────────────────────────────────────
// 8. DIAGRAMA DE ESTADOS
// ─────────────────────────────────────────────────────────────
async function gen08() {
  await writeDoc('08_diagrama_estados.docx', [
    ...cover('Diagrama de Estados', 'Ciclo de vida de entidades'),
    h1('1. Admisión'),
    p('Estados: PENDIENTE, ADMITIDO, ALTA, TRANSFERIDO, RECHAZADO, ANULADO.'),
    mono('PENDIENTE/ADMITIDO/TRANSFERIDO → [auto-atención] → ALTA (egreso)'),
    mono('Cualquier → RECHAZADO | ANULADO (cierre administrativo, bloquea asistencia)'),
    h1('2. Cita'),
    p('Estados: PROGRAMADA, REPROGRAMADA, CANCELADA, ATENDIDA, NO_ASISTIO.'),
    mono('PROGRAMADA ↔ REPROGRAMADA (activas, validan solapamiento)'),
    mono('PROGRAMADA/REPROGRAMADA → CANCELADA | ATENDIDA | NO_ASISTIO'),
    h1('3. Orden médica'),
    p('Estados: PENDIENTE, EN_PROCESO, COMPLETADO, RECHAZADO, PARCIAL, ANULADO.'),
    mono('PENDIENTE → EN_PROCESO → COMPLETADO | RECHAZADO | PARCIAL'),
    mono('Cualquier → ANULADO (farmacia reintegra stock)'),
    h1('4. Laboratorio / Imagen'),
    p('Estados: PENDIENTE, EN_PROCESO, COMPLETADO, RECHAZADO, ANULADO.'),
    mono('PENDIENTE → EN_PROCESO → COMPLETADO (lab: requiere adjunto)'),
    mono('→ RECHAZADO (muestra inválida) | ANULADO (baja administrativa)'),
    h1('5. Pago'),
    p('Estados: PENDIENTE, PAGADO, ANULADO.'),
    mono('PENDIENTE → PAGADO (requiere método de pago) | ANULADO'),
    h1('6. Triage'),
    p('No posee estado de ciclo de vida. Atributo prioridad: I_CRITICO, II_URGENTE, III_PRIORITARIO, IV_NO_URGENTE (calculado en frontend por signos vitales).'),
    h1('7. Atención médica'),
    p('Sin columna estado en BD. Estado operativo implícito: pendiente (campos "Pendiente") o completada (datos clínicos reales).'),
    h1('8. Tabla resumen'),
    tbl(
      ['Entidad', 'Estados terminales', 'Bloqueos'],
      [
        ['Admisión', 'ALTA, RECHAZADO, ANULADO', 'ANULADO/RECHAZADO bloquea asistencia'],
        ['Cita', 'CANCELADA, ATENDIDA, NO_ASISTIO', '—'],
        ['Orden', 'COMPLETADO, RECHAZADO, ANULADO', '—'],
        ['Lab/Imagen', 'COMPLETADO, RECHAZADO, ANULADO', 'COMPLETADO lab exige adjunto'],
        ['Pago', 'PAGADO, ANULADO', 'Admisión cerrada bloquea nuevo pago'],
      ],
    ),
  ]);
}

// ─────────────────────────────────────────────────────────────
// 9. PLAN DE PRUEBAS
// ─────────────────────────────────────────────────────────────
async function gen09() {
  const tests = [
    ['TC-001', 'Auth', 'Login válido', 'Usuario activo', 'POST login credenciales correctas', '200 + JWT + roles', 'Alta', 'Funcional'],
    ['TC-002', 'Auth', 'Login inválido', '—', 'POST login password incorrecta', '401 ApiErrorResponse', 'Alta', 'Seguridad'],
    ['TC-003', 'Auth', 'Acceso sin token', '—', 'GET /api/patients sin Bearer', '401', 'Alta', 'Seguridad'],
    ['TC-004', 'Auth', 'Rol sin permiso', 'Token CAJERO', 'POST /api/admissions', '403', 'Alta', 'Seguridad'],
    ['TC-005', 'Pacientes', 'Alta expediente', 'Recepcionista', 'Crear paciente DPI único', '201 activo=true', 'Alta', 'Funcional'],
    ['TC-006', 'Pacientes', 'DPI duplicado', 'Paciente existente', 'Crear mismo DPI', '400', 'Alta', 'Validación'],
    ['TC-007', 'Seguros', 'Póliza vigente', 'Paciente activo', 'Crear seguro fechas válidas', '201 activo=true', 'Alta', 'Funcional'],
    ['TC-008', 'Citas', 'Agendar cita', 'Médico disponible', 'POST cita futura PROGRAMADA', '201', 'Alta', 'Funcional'],
    ['TC-009', 'Citas', 'Solapamiento médico', 'Cita activa mismo horario', 'POST cita traslapada', '400 solapamiento', 'Alta', 'Regla negocio'],
    ['TC-010', 'Citas', 'Correo confirmación', 'Paciente con email, mail ON', 'Crear cita notifyEmail=true', '201; correo enviado async', 'Media', 'Integración'],
    ['TC-011', 'Citas', 'Reprogramar', 'Cita PROGRAMADA', 'PUT nueva fecha/REPROGRAMADA', '200', 'Alta', 'Funcional'],
    ['TC-012', 'Citas', 'Cancelar', 'Cita activa', 'DELETE lógico', 'CANCELADA', 'Alta', 'Funcional'],
    ['TC-013', 'Admisiones', 'Admisión seguro', 'Seguro vigente', 'POST ADMITIDO SEGURO', '201 + auto-atención', 'Alta', 'Funcional'],
    ['TC-014', 'Admisiones', 'Seguro inválido', 'Seguro vencido', 'POST SEGURO', '400', 'Alta', 'Regla negocio'],
    ['TC-015', 'Admisiones', 'Pago sitio', 'Sin seguro', 'POST PAGO_SITIO validado', '201', 'Alta', 'Funcional'],
    ['TC-016', 'Admisiones', 'Auto-atención', 'Estado ADMITIDO', 'Verificar atención médico jefe', 'Atención Pendiente x3', 'Alta', 'Integración'],
    ['TC-017', 'Admisiones', 'Anular', 'Admisión activa', 'DELETE lógico ANULADO', 'Bloquea nueva atención', 'Alta', 'Regla negocio'],
    ['TC-018', 'Triage', 'Alta urgencia', 'Admisión EMERGENCIA', 'POST signos vitales críticos', 'Prioridad I automática', 'Alta', 'Funcional'],
    ['TC-019', 'Triage', 'Admisión rechazada', 'Admisión RECHAZADO', 'POST triage', '400', 'Alta', 'Regla negocio'],
    ['TC-020', 'Atenciones', 'Filtro paciente', 'Sin admisión abierta', 'Nueva atención picker', 'Paciente no listado', 'Alta', 'UI'],
    ['TC-021', 'Atenciones', 'Visibilidad médico', 'Token MEDICO', 'GET list', 'Solo propias', 'Alta', 'Seguridad'],
    ['TC-022', 'Atenciones', 'Visibilidad jefe', 'Token MEDICO-JEFE', 'GET list', 'Todas', 'Alta', 'Seguridad'],
    ['TC-023', 'Atenciones', 'Reasignación', 'Jefe edita doctorId', 'PUT atención', '200', 'Alta', 'Funcional'],
    ['TC-024', 'Atenciones', 'Checkboxes órdenes', 'Atención guardada', 'Marcar Lab + guardar', 'Orden PENDIENTE creada', 'Alta', 'Integración'],
    ['TC-025', 'Atenciones', 'Lista órdenes edición', 'Atención con órdenes', 'Clic en orden', 'Detalle visible', 'Media', 'UI'],
    ['TC-026', 'Órdenes', 'Orden LAB', 'Atención existente', 'POST LABORATORIO', '201 + lab auto', 'Alta', 'Integración'],
    ['TC-027', 'Órdenes', 'Orden IMAGEN', 'Atención existente', 'POST IMAGEN', '201 + imagen auto', 'Alta', 'Integración'],
    ['TC-028', 'Órdenes', 'Farmacia stock', 'Stock suficiente', 'Despacho líneas', 'Stock decrementado', 'Alta', 'Integración'],
    ['TC-029', 'Órdenes', 'Anular farmacia', 'Orden despachada', 'ANULADO', 'Stock reintegrado', 'Alta', 'Regla negocio'],
    ['TC-030', 'Laboratorio', 'Correlativo auto', 'Orden LAB nueva', 'Ver recordNumber', 'AAAA-MM-DD-LQ-NNNNNNN', 'Alta', 'Regla negocio'],
    ['TC-031', 'Laboratorio', 'Completar sin adjunto', 'Lab EN_PROCESO', 'PUT COMPLETADO', '400 exige adjunto', 'Alta', 'Validación'],
    ['TC-032', 'Laboratorio', 'Completar con adjunto', 'Archivo PDF válido', 'POST attachment + COMPLETADO', '200', 'Alta', 'Funcional'],
    ['TC-033', 'Imágenes', 'Informe estudio', 'Orden IMAGEN', 'PUT reportResult', '200 COMPLETADO', 'Media', 'Funcional'],
    ['TC-034', 'Pagos', 'Cobro seguro 80%', 'Seguro activo', 'Sugerir copago + PAGADO', 'Total correcto', 'Alta', 'Funcional'],
    ['TC-035', 'Pagos', 'Cobertura 100%', 'Seguro 100%', 'Pago total 0', 'PAGADO', 'Media', 'Funcional'],
    ['TC-036', 'Pagos', 'Comprobante PDF', 'Pago PAGADO con recibo', 'Imprimir comprobante', 'PDF descargado', 'Media', 'Funcional'],
    ['TC-037', 'Pagos', 'Admisión anulada', 'Admisión ANULADO', 'POST pago', '400', 'Alta', 'Regla negocio'],
    ['TC-038', 'Permisos', 'Recepcionista citas', 'Token RECEP', 'Abrir formulario cita', 'Catálogos cargan', 'Alta', 'Integración'],
    ['TC-039', 'Permisos', 'Médico medicamentos', 'Token MEDICO orden FARMACIA', 'GET medications', '200', 'Alta', 'Seguridad'],
    ['TC-040', 'Reportes', 'Export CSV', 'Admin/Auditor', 'Generar reporte citas', 'CSV válido', 'Media', 'Funcional'],
    ['TC-041', 'E2E', 'Consulta completa', 'Multi-rol', 'Flujo A documentado', 'Episodio cerrado lógico', 'Alta', 'E2E'],
    ['TC-042', 'E2E', 'Emergencia', 'Multi-rol', 'Flujo B con triage', 'Triage + atención OK', 'Alta', 'E2E'],
    ['TC-043', 'E2E', 'Walk-in', 'Sin cita', 'Admisión sin appointmentId', 'Atención posible', 'Media', 'E2E'],
    ['TC-044', 'E2E', 'Cancelación cita', 'Cita programada', 'Cancelar antes admisión', 'No admite flujo', 'Media', 'E2E'],
    ['TC-045', 'E2E', 'Stock insuficiente', 'Stock bajo', 'Orden qty > stock', 'Error controlado', 'Media', 'Regla negocio'],
  ];
  await writeDoc('09_plan_pruebas_calidad.docx', [
    ...cover('Plan de Pruebas de Calidad', 'Matriz de casos de prueba'),
    h1('1. Objetivo'),
    p('El plan de pruebas verifica el cumplimiento funcional, de seguridad e integración del sistema hospitalario en escenarios normales, alternativos y de error.'),
    h1('2. Alcance'),
    bullet('Pruebas funcionales por módulo.'),
    bullet('Pruebas de reglas de negocio y validación.'),
    bullet('Pruebas de seguridad por rol.'),
    bullet('Pruebas de integración entre módulos.'),
    bullet('Pruebas end-to-end de flujos consulta y emergencia.'),
    h1('3. Criterios de aceptación global'),
    bullet('Compilación backend (mvn test) y frontend (ng build) sin errores.'),
    bullet('Respuestas API conformes a ApiErrorResponse en errores.'),
    bullet('Estados terminales alcanzables según diagrama de estados.'),
    bullet('Roles respetan matriz de permisos documentada.'),
    h1('4. Matriz de casos de prueba'),
    tbl(['ID', 'Módulo', 'Escenario', 'Precondición', 'Pasos', 'Resultado esperado', 'Prioridad', 'Tipo'], tests),
    p(''),
    h1('5. Entorno de prueba'),
    tbl(
      ['Elemento', 'Configuración'],
      [
        ['Backend', 'mvn spring-boot:run puerto 8080'],
        ['Frontend', 'npm start puerto 4200'],
        ['BD', 'PostgreSQL hospital schema'],
        ['Usuarios', 'admin, recepcion, medico, medico-jefe, laboratorio, farmacia, cajero'],
      ],
    ),
  ]);
}

// ─────────────────────────────────────────────────────────────
// 10. DIAGRAMA DE ARQUITECTURA
// ─────────────────────────────────────────────────────────────
async function gen10() {
  await writeDoc('10_diagrama_arquitectura.docx', [
    ...cover('Diagrama de Arquitectura', 'Vista general del sistema'),
    h1('1. Estilo arquitectónico'),
    p('Arquitectura monolítica en tres capas: presentación (Angular SPA), lógica de negocio (Spring Boot) y datos (PostgreSQL). Comunicación síncrona HTTP/JSON. Autenticación stateless JWT.'),
    h1('2. Vista de componentes'),
    ...diagramBlock('Componentes principales', [
      '┌─────────────────────────────────────────────────┐',
      '│           CAPA DE PRESENTACIÓN                  │',
      '│  Portal público │ Intranet Angular │ Material UI│',
      '└────────────────────┬────────────────────────────┘',
      '                     │ HTTPS/HTTP + JSON + JWT',
      '┌────────────────────▼────────────────────────────┐',
      '│           CAPA DE APLICACIÓN                    │',
      '│  Controllers │ Services │ Security │ Mail │ Storage│',
      '└────────────────────┬────────────────────────────┘',
      '                     │ JDBC',
      '┌────────────────────▼────────────────────────────┐',
      '│           CAPA DE DATOS                         │',
      '│              PostgreSQL (schema hospital)        │',
      '└─────────────────────────────────────────────────┘',
      '',
      'Servicios externos: Gmail SMTP, Azure Blob (prod)',
    ]),
    h1('3. Principios de diseño'),
    bullet('Separación por capas: controller → service → repository → entity.'),
    bullet('DTOs para entrada/salida; validación Jakarta en frontera API.'),
    bullet('Manejo global de excepciones → ApiErrorResponse.'),
    bullet('Auditoría transversal: negocio (bitácora) y seguridad.'),
    bullet('Almacenamiento de adjuntos abstracto (local/Azure).'),
    h1('4. Flujo de datos'),
    p('El cliente Angular consume APIs REST. Los servicios aplican reglas de negocio, persisten vía JPA y emiten eventos (correo asíncrono). Los reportes agregan consultas de solo lectura.'),
  ]);
}

// ─────────────────────────────────────────────────────────────
// 11. DIAGRAMA DE CAPAS
// ─────────────────────────────────────────────────────────────
async function gen11() {
  await writeDoc('11_diagrama_capas.docx', [
    ...cover('Diagrama de Capas', 'Arquitectura por capas'),
    h1('1. Existencia de arquitectura en capas'),
    p('El sistema implementa arquitectura en capas de forma explícita tanto en backend como en frontend, conforme a las convenciones del proyecto.'),
    h1('2. Capas backend'),
    tbl(
      ['Capa', 'Paquete', 'Responsabilidad'],
      [
        ['Controller', '*.controller', 'Endpoints REST, HTTP status, delegación'],
        ['Service', '*.service', 'Reglas de negocio, transacciones, auditoría'],
        ['Repository', '*.repository', 'Acceso datos Spring Data JPA'],
        ['Entity', '*.entity', 'Mapeo ORM tablas PostgreSQL'],
        ['DTO', '*.dto', 'Contratos request/response JSON'],
        ['Exception', 'exception', 'GlobalExceptionHandler, ApiErrorResponse'],
        ['Config', 'config, security, storage, mail', 'Beans, seguridad, infra'],
      ],
    ),
    p(''),
    h1('3. Capas frontend'),
    tbl(
      ['Capa', 'Ubicación', 'Responsabilidad'],
      [
        ['Páginas', 'features/*/pages', 'Vistas listado, routing'],
        ['Componentes', 'features/*/components', 'Formularios, diálogos, detalle'],
        ['Servicios', 'features/*/services', 'Cliente HTTP hacia API'],
        ['Modelos', 'features/*/models', 'Interfaces TypeScript'],
        ['Core', 'core/', 'Auth, guards, menú, constantes rol'],
        ['Shared', 'features/shared', 'Pickers, validadores reutilizables'],
      ],
    ),
    p(''),
    h1('4. Diagrama de dependencias'),
    ...diagramBlock('Flujo de dependencia (backend)', [
      'Controller → Service → Repository → Entity',
      'Controller ← DTO (entrada/salida)',
      'Service → BusinessAuditRecorder, StorageService, MailService',
      'Security Filter → Controller (pre-request JWT)',
    ]),
    ...diagramBlock('Flujo de dependencia (frontend)', [
      'Page → Dialog/Component → ApiService → HttpClient',
      'Page → AuthService / roleGuard',
      'Component → Models, Shared utils',
    ]),
  ]);
}

// ─────────────────────────────────────────────────────────────
// 12. FRAMEWORK, SERVIDORES Y CONSTRUCCIÓN
// ─────────────────────────────────────────────────────────────
async function gen12() {
  await writeDoc('12_framework_servidores_construccion.docx', [
    ...cover('Framework, Servidores y Construcción', 'Especificaciones técnicas de build'),
    h1('1. Framework backend'),
    tbl(
      ['Aspecto', 'Detalle'],
      [
        ['Framework', 'Spring Boot 3.4.4'],
        ['Lenguaje', 'Java 17'],
        ['Build', 'Maven (pom.xml)'],
        ['Empaquetado', 'JAR ejecutable'],
        ['Servidor embebido', 'Apache Tomcat (spring-boot-starter-web)'],
        ['ORM', 'Hibernate / Spring Data JPA'],
        ['Seguridad', 'Spring Security + JWT'],
        ['Validación', 'Jakarta Bean Validation'],
        ['Documentación API', 'Springdoc OpenAPI (perfil dev)'],
      ],
    ),
    p(''),
    h1('2. Framework frontend'),
    tbl(
      ['Aspecto', 'Detalle'],
      [
        ['Framework', 'Angular 19.2.x'],
        ['Lenguaje', 'TypeScript 5.7.x'],
        ['UI', 'Angular Material 19.2.x'],
        ['Build', 'Angular CLI (@angular/build)'],
        ['Salida', 'dist/hospital-web (archivos estáticos)'],
        ['Estilo', 'SCSS por componente'],
        ['HTTP', 'HttpClient + interceptors JWT'],
      ],
    ),
    p(''),
    h1('3. Servidores y runtime'),
    tbl(
      ['Servidor', 'Especificación'],
      [
        ['API', 'Spring Boot embedded Tomcat, puerto 8080'],
        ['Frontend dev', 'ng serve, puerto 4200'],
        ['Base de datos', 'PostgreSQL 15, puerto 5432, schema hospital'],
        ['Correo', 'SMTP Gmail smtp.gmail.com:587 STARTTLS'],
        ['Archivos prod', 'Azure Blob Storage (perfil prod)'],
        ['Archivos dev', 'Filesystem ./data/uploads'],
      ],
    ),
    p(''),
    h1('4. Proceso de construcción'),
    h2('4.1 Backend'),
    mono('cd backend'),
    mono('mvn clean compile test'),
    mono('mvn spring-boot:run'),
    h2('4.2 Frontend'),
    mono('cd frontend'),
    mono('npm install'),
    mono('npm run build'),
    mono('npm start'),
    h1('5. Configuración de despliegue'),
    bullet('Variables JWT: app.jwt.secret, app.jwt.expiration-minutes.'),
    bullet('Variables mail: MAIL_USERNAME, MAIL_PASSWORD, MAIL_ENABLED, MAIL_FROM_NAME.'),
    bullet('Perfil prod: app.storage.type=azure + credenciales Azure.'),
    bullet('CORS: app.cors.allowed-origins para dominio frontend producción.'),
    h1('6. Requisitos mínimos de hardware (referencia)'),
    tbl(
      ['Componente', 'Mínimo recomendado'],
      [
        ['Servidor API + BD', '2 vCPU, 4 GB RAM, 20 GB disco'],
        ['Frontend estático', 'Hosting estático o mismo servidor web'],
        ['PostgreSQL', 'Instancia dedicada o co-located'],
      ],
    ),
  ]);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  await gen01();
  await gen02();
  await gen03();
  await gen04();
  await gen05();
  await gen06();
  await gen07();
  await gen08();
  await gen09();
  await gen10();
  await gen11();
  await gen12();
  console.log('\nDocumentos generados en:', OUT_DIR);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
