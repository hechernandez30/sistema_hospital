/**
 * Rellena la plantilla institucional de Manual de Usuario con contenido
 * del sistema hospitalario, preservando estilos y encabezados OOXML.
 */
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const TEMPLATE_SRC =
  process.env.MANUAL_TEMPLATE ||
  'C:/Users/Administrador/Downloads/PLANTILLA DE MANUAL DE USUARIO(1).docx';
const OUTPUT = path.join(
  ROOT,
  'docs/documentacion_final/manual_usuario_plantilla.docx',
);
const PLANTILLA_COPY = path.join(
  ROOT,
  'docs/plantillas/PLANTILLA_MANUAL_USUARIO.docx',
);

const META = {
  proyecto: 'Sistema Hospitalario Privado Hospital H&H',
  organismo: 'Hospital H&H',
  empresa: 'Hospital H&H',
  unidad: 'Dirección de Tecnologías de la Información — Hospital H&H',
  autor: 'Equipo de Ingeniería de Software — Universidad Mariano Gálvez',
  fecha: '30/05/2026',
  version: '0100',
  entregable: 'Manual de Usuario',
};

function esc(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function run(text, style = 'Textbody', jc) {
  const jcXml = jc ? `<w:jc w:val="${jc}"/>` : '';
  return `<w:p><w:pPr><w:pStyle w:val="${style}"/>${jcXml}</w:pPr><w:r><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
}

function bullet(text) {
  return `<w:p><w:pPr><w:pStyle w:val="Textbody"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
}

function title2(text) {
  return `<w:p><w:pPr><w:pStyle w:val="Ttulo2"/></w:pPr><w:r><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
}

function title3(text) {
  return `<w:p><w:pPr><w:pStyle w:val="Ttulo3"/></w:pPr><w:r><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
}

function fillEmptyPara(xml, paraId, innerRuns) {
  const re = new RegExp(
    `<w:p w14:paraId="${paraId}"[^>]*><w:pPr>[^<]*(?:<[^>]+>[^<]*)*</w:pPr></w:p>`,
  );
  const match = xml.match(re);
  if (!match) {
    console.warn(`No se encontró párrafo vacío: ${paraId}`);
    return xml;
  }
  const styleMatch = match[0].match(/<w:pStyle w:val="([^"]+)"/);
  const style = styleMatch ? styleMatch[1] : 'Textbody';
  const jcMatch = match[0].match(/<w:jc w:val="([^"]+)"/);
  const jc = jcMatch ? jcMatch[1] : null;
  const open = match[0].replace('</w:p>', '');
  const replacement =
    innerRuns ||
    open +
      `<w:r><w:t xml:space="preserve">${esc('')}</w:t></w:r></w:p>`;
  if (innerRuns) {
    return xml.replace(match[0], replacement);
  }
  return xml;
}

function paras(texts, style = 'Textbody', jc) {
  return texts.map((t) => run(t, style, jc)).join('');
}

function replaceParaContent(xml, paraId, paragraphsXml) {
  const re = new RegExp(
    `<w:p w14:paraId="${paraId}"[\\s\\S]*?</w:p>`,
  );
  return xml.replace(re, paragraphsXml);
}

const SECTION_CONTENT = {
  objeto: paras([
    'El presente manual describe el uso funcional del Sistema Hospitalario Privado Hospital H&H. Documenta los procedimientos operativos que el personal autorizado debe seguir para registrar pacientes, gestionar citas, admitir ingresos, atender consultas, solicitar estudios, dispensar medicamentos y registrar pagos.',
    'El documento está dirigido a usuarios finales de la intranet hospitalaria: recepcionistas, médicos, personal de laboratorio, farmacia, caja, recursos humanos, auditores y administradores del sistema.',
  ]),

  alcance: paras([
    'El alcance comprende la operación diaria de los módulos clínicos y administrativos disponibles en la intranet web del hospital. Incluye acceso al sistema, navegación por roles, procedimientos por módulo y mensajes de error frecuentes.',
    'Quedan fuera de este manual la instalación de servidores, configuración de base de datos, desarrollo de software y políticas institucionales no relacionadas con la operación del sistema.',
  ]),

  funcionalidad: paras([
    'El sistema integra el ciclo asistencial y administrativo del hospital privado. Gestiona expedientes de pacientes, pólizas de seguro, agenda médica, admisiones, triage de emergencia, atenciones clínicas, órdenes médicas, laboratorio, imagenología, farmacia, pagos y reportes de auditoría.',
    'Cada usuario accede mediante credenciales institucionales y visualiza únicamente los módulos autorizados según su rol. La autenticación utiliza token JWT; al cerrar sesión se invalida el acceso a la intranet.',
  ]),

  modeloLogico: paras(
    [
      'Arquitectura lógica de tres capas:',
      '• Capa de presentación: aplicación web Angular accesible desde navegador.',
      '• Capa de servicios: API REST Spring Boot que aplica reglas de negocio y seguridad.',
      '• Capa de datos: base de datos PostgreSQL con esquema hospital.',
      'Los módulos de dominio se organizan por entidades clínicas y administrativas: pacientes, seguros, citas, admisiones, triage, atenciones médicas, órdenes, laboratorio, imágenes, medicamentos, pagos, personal, roles y bitácora.',
    ],
    'Standard',
    'both',
  ),

  navegacion: paras(
    [
      'Tras el inicio de sesión, el usuario accede al panel principal con menú lateral dinámico según su rol. Las rutas principales son:',
      '• Pacientes y seguros: registro de expedientes y pólizas.',
      '• Citas: agenda médica con estados programada, reprogramada, cancelada, atendida y no asistió.',
      '• Admisiones: ingreso clínico vinculado a paciente y cita opcional.',
      '• Triage: clasificación de prioridad en ingresos de emergencia.',
      '• Atenciones médicas: consulta, evaluación, diagnóstico y plan de tratamiento.',
      '• Órdenes, laboratorio, imágenes, medicamentos y pagos: continuidad del flujo asistencial.',
      '• Reportes y bitácora: consulta ex post para perfiles de auditoría y administración.',
    ],
    'Standard',
    'both',
  ),

  seccion3Intro: paras(
    [
      'Esta sección detalla la operación de los subsistemas de la intranet hospitalaria. Cada subsistema agrupa pantallas relacionadas con un proceso del ciclo asistencial o administrativo. Las instrucciones se presentan en tercera persona y asumen que el usuario ya dispone de credenciales válidas.',
    ],
    'Standard',
    'both',
  ),

  faq: paras([
    '¿Cómo accede el personal al sistema? Mediante navegador web, enlace de acceso institucional, usuario y contraseña asignados por administración.',
    '¿Por qué no aparecen todos los módulos en el menú? El menú lateral se filtra por rol. Si falta un módulo requerido, el administrador debe verificar el rol asignado al usuario.',
    '¿Cuándo se registra triage? Únicamente en admisiones clasificadas como emergencia, antes o durante la atención clínica prioritaria.',
    '¿Quién reasigna una atención médica? El perfil médico jefe visualiza todas las atenciones pendientes y puede asignarlas al médico tratante correspondiente.',
    '¿Qué ocurre al admitir un paciente? Si la admisión queda en estado pendiente, admitido o transferido, el sistema genera automáticamente una atención médica pendiente asignada al médico jefe.',
    '¿Cómo se confirma una cita al paciente? Al crear o reprogramar una cita, el operador puede activar el envío de confirmación por correo electrónico.',
    '¿Qué adjunto exige laboratorio? Al marcar un estudio como completado, el sistema requiere un archivo adjunto válido con el resultado.',
  ]),
};

function buildSection3Detail() {
  const blocks = [];

  blocks.push(title2('Acceso e intranet'));
  blocks.push(
    paras([
      'El subsistema de acceso controla la entrada al entorno operativo. Comprende el portal público informativo y la intranet restringida al personal autorizado.',
    ]),
  );
  blocks.push(title3('Inicio de sesión'));
  blocks.push(
    paras([
      'El usuario ingresa credenciales en la pantalla de acceso. Tras validación exitosa, el sistema emite un token de sesión y redirige al panel principal. Si las credenciales son incorrectas o la cuenta está inactiva, se muestra un mensaje de error sin revelar detalles de seguridad.',
    ]),
  );
  blocks.push(title3('Panel principal y menú lateral'));
  blocks.push(
    paras([
      'El panel principal presenta el menú lateral con los módulos habilitados para el rol activo. Desde allí se accede a listados, formularios de registro y consulta de detalle. Para operar con otro perfil, el usuario debe cerrar sesión e ingresar con credenciales distintas.',
    ]),
  );

  blocks.push(title2('Pacientes y seguros'));
  blocks.push(
    paras([
      'Permite registrar expedientes con identificación única (DPI/NIT), datos demográficos y consentimiento de privacidad. Las pólizas de seguro se asocian al paciente con porcentaje de cobertura y vigencia, necesarias para la validación financiera en admisiones y pagos.',
    ]),
  );
  blocks.push(title3('Registro de paciente'));
  blocks.push(
    paras([
      'El operador completa el formulario de paciente y guarda el registro. El sistema valida unicidad del documento de identidad y campos obligatorios antes de persistir.',
    ]),
  );
  blocks.push(title3('Pólizas de seguro'));
  blocks.push(
    paras([
      'Desde el detalle del paciente se agregan pólizas activas. En admisiones y pagos el sistema consulta la cobertura vigente para calcular montos a cargo del paciente y del asegurador.',
    ]),
  );

  blocks.push(title2('Citas y admisiones'));
  blocks.push(
    paras([
      'El módulo de citas agenda consultas indicando paciente, médico, fecha, hora y motivo. Los estados posibles son programada, reprogramada, cancelada, atendida y no asistió. Opcionalmente se envía confirmación por correo al paciente.',
      'Las admisiones vinculan paciente y cita opcional. Se verifica seguro vigente o pago en sitio según política operativa. Al crear una admisión en estado pendiente, admitido o transferido, el sistema genera una atención médica pendiente asignada al médico jefe.',
    ]),
  );

  blocks.push(title2('Triage y atenciones médicas'));
  blocks.push(
    paras([
      'El triage aplica exclusivamente a ingresos de emergencia. El operador registra signos vitales; el sistema calcula automáticamente la prioridad clínica (I a IV).',
      'En atenciones médicas, el médico jefe supervisa el total de casos y reasigna al médico tratante. El médico completa motivo, evaluación, diagnóstico y plan de tratamiento. Mediante casillas de selección puede solicitar laboratorio, imagenología, farmacia u hospitalización. En edición, las órdenes y exámenes asociados se consultan desde listas interactivas.',
    ]),
  );

  blocks.push(title2('Órdenes, laboratorio e imágenes'));
  blocks.push(
    paras([
      'Las órdenes médicas se generan desde la atención clínica. Al crear órdenes de tipo laboratorio o imagen, el sistema genera automáticamente registros pendientes en los módulos correspondientes.',
      'El personal de laboratorio registra muestra, resultado y adjunto obligatorio al completar el estudio. Imagenología sigue flujo análogo de registro y actualización de estado.',
    ]),
  );

  blocks.push(title2('Farmacia, pagos y reportes'));
  blocks.push(
    paras([
      'Farmacia despacha medicamentos según órdenes autorizadas y descuenta inventario. Caja registra pagos aplicando cobertura de seguro e imprime comprobante en PDF.',
      'Reportes y bitácora permiten a perfiles de auditoría y administración consultar operaciones históricas y eventos de seguridad del sistema.',
    ]),
  );

  blocks.push(title3('Mensajes de error frecuentes'));
  blocks.push(
    paras([
      'Credenciales inválidas: usuario o contraseña incorrectos, o cuenta deshabilitada. Verificar datos e intentar nuevamente; contactar al administrador si persiste.',
      'Acceso denegado (403): el rol no tiene permiso para la operación solicitada.',
      'Sesión expirada (401): el token caducó; cerrar sesión e ingresar de nuevo.',
      'Validación de formulario: campos obligatorios incompletos o formatos inválidos; corregir según mensaje indicado.',
      'Reglas de negocio: admisión rechazada o anulada bloquea triage, nuevas atenciones y pagos; laboratorio completado exige adjunto; cita fuera de disponibilidad del médico.',
    ]),
  );

  return blocks.join('');
}

function applyReplacements(xml) {
  let doc = xml;

  const global = {
    '<Logotipo de la empresa>': META.empresa,
    '&lt;Logotipo de la empresa&gt;': esc(META.empresa),
    '<Nombre Proyecto>': META.proyecto,
    '&lt;Nombre Proyecto&gt;': esc(META.proyecto),
    '<Nombre Consejería u Organismo Autónomo>': META.organismo,
    '&lt;Nombre Consejería u Organismo Autónomo&gt;': esc(META.organismo),
    '<Nombre de la Empresa>': META.empresa,
    '&lt;Nombre de la Empresa&gt;': esc(META.empresa),
    '<Nombre Apellido1 Apellido2>': META.autor,
    '&lt;Nombre Apellido1 Apellido2&gt;': esc(META.autor),
    '<Unidad Organizativa>': META.unidad,
    '&lt;Unidad Organizativa&gt;': esc(META.unidad),
    'DD/MM/AAAA': META.fecha,
    'Subsistema 1': 'Acceso e intranet',
    '3.1 3.1 Acceso e intranet': '3.1 Acceso e intranet',
    '3.1.1 Pantalla 1': '3.1.1 Inicio de sesión',
    '3.1.2 Mensajes de error frecuentesr': '3.1.2 Mensajes de error frecuentes',
    'Mensajes de error frecuentesr': 'Mensajes de error frecuentes',
  };

  for (const [from, to] of Object.entries(global)) {
    doc = doc.split(from).join(to);
  }

  doc = replaceParaContent(doc, '207550F2', SECTION_CONTENT.objeto);
  doc = replaceParaContent(doc, '0C982C84', SECTION_CONTENT.alcance);
  doc = replaceParaContent(doc, '5F352466', SECTION_CONTENT.funcionalidad);
  doc = replaceParaContent(doc, '3D196F98', SECTION_CONTENT.modeloLogico);
  doc = replaceParaContent(doc, '5A015254', SECTION_CONTENT.navegacion);
  doc = replaceParaContent(doc, '5E0C6C4A', SECTION_CONTENT.seccion3Intro);
  doc = replaceParaContent(doc, '2CBE6303', SECTION_CONTENT.faq);

  const section3Start = doc.indexOf('<w:p w14:paraId="1DA33378"');
  const faqStart = doc.indexOf('<w:p w14:paraId="3A984FB0"');
  if (section3Start >= 0 && faqStart > section3Start) {
    const before = doc.slice(0, section3Start);
    const after = doc.slice(faqStart);
    doc = before + buildSection3Detail() + after;
  }

  doc = doc.replace(
    /<w:r w:rsidR="004E5456"><w:t>r<\/w:t><\/w:r>/g,
    '',
  );

  return doc;
}

function patchControlTables(xml) {
  let doc = xml;
  doc = doc.replace(
    /<w:t>&lt;Nombre Consejería u Organismo Autónomo&gt;<\/w:t>/g,
    `<w:t>${esc(META.organismo)}</w:t>`,
  );
  doc = doc.replace(
    /<w:t>&lt;Nombre Proyecto&gt;<\/w:t>/g,
    `<w:t>${esc(META.proyecto)}</w:t>`,
  );
  doc = doc.replace(
    /<w:t>&lt;Nombre Apellido1 Apellido2&gt;<\/w:t>/g,
    `<w:t>${esc(META.autor)}</w:t>`,
  );
  return doc;
}

function ensureDirs() {
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.mkdirSync(path.dirname(PLANTILLA_COPY), { recursive: true });
}

function main() {
  if (!fs.existsSync(TEMPLATE_SRC)) {
    console.error(`Plantilla no encontrada: ${TEMPLATE_SRC}`);
    process.exit(1);
  }

  ensureDirs();
  if (!fs.existsSync(PLANTILLA_COPY)) {
    fs.copyFileSync(TEMPLATE_SRC, PLANTILLA_COPY);
    console.log(`Plantilla copiada a ${PLANTILLA_COPY}`);
  }

  const zip = new AdmZip(TEMPLATE_SRC);
  const entries = zip.getEntries();

  for (const entry of entries) {
    const name = entry.entryName;
    if (!/\.xml$/i.test(name)) continue;

    let content = entry.getData().toString('utf8');
    if (name === 'word/document.xml') {
      content = applyReplacements(content);
      content = patchControlTables(content);
    } else if (name === 'word/header1.xml') {
      content = content
        .split('&lt;Nombre Proyecto&gt;').join(esc(META.proyecto))
        .split('&lt;Unidad Organizativa&gt;').join(esc(META.unidad))
        .split('<Nombre Proyecto>').join(esc(META.proyecto))
        .split('<Unidad Organizativa>').join(esc(META.unidad));
    } else if (name === 'docProps/core.xml') {
      content = content
        .replace(/<dc:title[^>]*>[^<]*<\/dc:title>/, `<dc:title>${esc(META.entregable)} — ${esc(META.proyecto)}</dc:title>`)
        .replace(/<dc:creator[^>]*>[^<]*<\/dc:creator>/, `<dc:creator>${esc(META.autor)}</dc:creator>`)
        .replace(/<cp:lastModifiedBy[^>]*>[^<]*<\/cp:lastModifiedBy>/, `<cp:lastModifiedBy>${esc(META.autor)}</cp:lastModifiedBy>`);
    } else if (name === 'docProps/custom.xml') {
      content = content
        .split('&lt;Nombre de la Empresa&gt;').join(esc(META.empresa))
        .split('&lt;Unidad Organizativa&gt;').join(esc(META.unidad));
    }
    zip.updateFile(name, Buffer.from(content, 'utf8'));
  }

  zip.writeZip(OUTPUT);
  console.log(`Manual generado: ${OUTPUT}`);
}

main();
