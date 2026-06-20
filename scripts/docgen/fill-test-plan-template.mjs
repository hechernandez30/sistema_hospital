/**
 * Rellena la plantilla institucional de Plan de Pruebas de Software
 * con contenido del sistema hospitalario, preservando formato OOXML.
 */
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const TEMPLATE_DOC =
  process.env.PPP_TEMPLATE_DOC ||
  'C:/Users/Administrador/Downloads/Plantilla de Plan de Pruebas de Software (1)(1).doc';
const TEMPLATE_DOCX = path.join(
  ROOT,
  'docs/plantillas/PLANTILLA_PLAN_PRUEBAS.docx',
);
const OUTPUT = path.join(
  ROOT,
  'docs/documentacion_final/plan_pruebas_plantilla.docx',
);

const META = {
  proyecto: 'Sistema Hospitalario Privado Hospital H&H',
  organismo: 'Hospital H&H',
  cliente: 'Hospital H&H',
  autor: 'Equipo de Ingeniería de Software — Universidad Mariano Gálvez',
  patrocinador: 'Dirección General — Hospital H&H',
  gerenteProyecto: 'Líder de proyecto — Hospital H&H',
  gerentePruebas: 'Analista de calidad — Equipo UMG',
  fecha: '30/05/2026',
  version: '1.0',
  versionDesc: 'Versión inicial del plan de pruebas del sistema hospitalario.',
};

function esc(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cellText(text, center = false) {
  const jc = center ? '<w:jc w:val="center"/>' : '';
  return `<w:p w:rsidR="00PPF001" w:rsidRDefault="00PPF001"><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/>${jc}<w:rPr><w:rFonts w:eastAsia="Times New Roman" w:cs="Arial"/><w:color w:val="000000"/><w:szCs w:val="24"/><w:lang w:eastAsia="es-VE"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="Times New Roman" w:cs="Arial"/><w:color w:val="000000"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
}

function cellTextSmall(text, center = false) {
  const jc = center ? '<w:jc w:val="center"/>' : '';
  return `<w:p w:rsidR="00PPF001" w:rsidRDefault="00PPF001"><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/>${jc}<w:rPr><w:rFonts w:eastAsia="Times New Roman" w:cs="Arial"/><w:color w:val="000000"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:lang w:eastAsia="es-VE"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="Times New Roman" w:cs="Arial"/><w:color w:val="000000"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
}

function bodyPara(text) {
  return `<w:p w:rsidR="00PPF001" w:rsidRDefault="00PPF001" w:rsidP="00B97EF4"><w:pPr><w:shd w:val="clear" w:color="auto" w:fill="FFFFFF"/><w:spacing w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:eastAsia="Times New Roman" w:cs="Arial"/><w:color w:val="00B050"/><w:szCs w:val="24"/><w:lang w:eastAsia="es-VE"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="Times New Roman" w:cs="Arial"/><w:color w:val="00B050"/><w:szCs w:val="24"/><w:lang w:eastAsia="es-VE"/></w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
}

function blueCell(text) {
  return `<w:p w:rsidR="00PPF001" w:rsidRDefault="00PPF001"><w:pPr><w:spacing w:line="256" w:lineRule="auto"/><w:rPr><w:rFonts w:cs="Arial"/><w:color w:val="0000FF"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:cs="Arial"/><w:color w:val="000000"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
}

function coverTitle(text) {
  return `<w:p w:rsidR="002D4F14" w:rsidRDefault="002D4F14" w:rsidP="00CA271E"><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/><w:jc w:val="center"/><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:b/><w:i/><w:color w:val="00B050"/><w:sz w:val="36"/><w:szCs w:val="36"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:b/><w:i/><w:color w:val="00B050"/><w:sz w:val="36"/><w:szCs w:val="36"/></w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
}

function replaceParagraphContaining(xml, needle, replacement) {
  const escNeedle = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(
    `<w:p\\b[^>]*>(?:(?!<w:p\\b).)*${escNeedle}(?:(?!<\\/w:p>).)*<\\/w:p>`,
    's',
  );
  if (!re.test(xml)) {
    console.warn(`Párrafo no encontrado: ${needle}`);
    return xml;
  }
  return xml.replace(re, replacement);
}

function fillTableRowByLabel(xml, label, value) {
  const escLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(
    `(<w:tr\\b[\\s\\S]*?<w:t>${escLabel}<\\/w:t>[\\s\\S]*?<\\/w:tc>\\s*<w:tc>\\s*<w:tcPr>[\\s\\S]*?<\\/w:tcPr>\\s*)<w:p\\b[\\s\\S]*?<\\/w:p>`,
    's',
  );
  if (!re.test(xml)) {
    console.warn(`Fila no encontrada: ${label}`);
    return xml;
  }
  return xml.replace(re, `$1${cellText(value)}`);
}

function fillTableRowContaining(xml, rowNeedle, value) {
  const escNeedle = rowNeedle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(
    `(<w:tr\\b[\\s\\S]*?${escNeedle}[\\s\\S]*?<\\/w:tc>\\s*<w:tc>\\s*<w:tcPr>[\\s\\S]*?<\\/w:tcPr>\\s*)<w:p\\b[\\s\\S]*?<\\/w:p>`,
    's',
  );
  if (!re.test(xml)) {
    console.warn(`Fila (parcial) no encontrada: ${rowNeedle}`);
    return xml;
  }
  return xml.replace(re, `$1${cellText(value)}`);
}

function ensureTemplateDocx() {
  fs.mkdirSync(path.dirname(TEMPLATE_DOCX), { recursive: true });
  if (fs.existsSync(TEMPLATE_DOCX)) return TEMPLATE_DOCX;
  if (!fs.existsSync(TEMPLATE_DOC)) {
    throw new Error(`Plantilla no encontrada: ${TEMPLATE_DOC}`);
  }
  const ps = `
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open('${TEMPLATE_DOC.replace(/'/g, "''")}')
$doc.SaveAs([ref]'${TEMPLATE_DOCX.replace(/'/g, "''")}', [ref]16)
$doc.Close()
$word.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
`;
  execSync(`powershell -NoProfile -Command "${ps.replace(/"/g, '\\"').replace(/\n/g, '; ')}"`, {
    stdio: 'inherit',
  });
  return TEMPLATE_DOCX;
}

const RESUMEN = [
  'El presente documento constituye el plan maestro de pruebas del Sistema Hospitalario Privado Hospital H&H. Su propósito es definir la estrategia, el alcance y los criterios de aceptación para validar el software antes de su operación en el entorno institucional.',
  'El plan se alinea con el proyecto de desarrollo monolítico (Spring Boot 3.4.4, Angular 19, PostgreSQL 15) y cubre pruebas funcionales, de reglas de negocio, de seguridad por rol, de integración entre módulos y pruebas extremo a extremo (E2E) de los flujos de consulta programada y emergencia.',
  'El esfuerzo contempla 45 casos de prueba identificados (TC-001 a TC-045), ejecutados en entorno local con backend en puerto 8080, frontend en puerto 4200 y base de datos hospital. Las restricciones incluyen disponibilidad de usuarios de prueba por rol, conectividad SMTP opcional para notificaciones de citas y adjuntos de laboratorio en filesystem local.',
  'Los criterios globales de aceptación exigen compilación exitosa (mvn test y ng build), respuestas de error conformes a ApiErrorResponse, respeto de la matriz de permisos por rol y trazabilidad de estados terminales en admisiones, atenciones, órdenes, laboratorio y pagos.',
];

const ALCANCE = [
  'El alcance incluye los módulos clínicos y administrativos de la intranet: autenticación, pacientes, seguros, citas, admisiones, triage (emergencia), atenciones médicas, órdenes médicas, laboratorio, imagenología, medicamentos, pagos, reportes, bitácora, roles, usuarios, personal y especialidades.',
  'Se verifican flujos E2E de consulta programada (paciente → cita → admisión → atención → órdenes → estudios → pago) y de emergencia (admisión → triage → atención → órdenes → estudios → pago).',
  'Quedan fuera del alcance: pruebas de carga masiva, pruebas de penetración externa, configuración de infraestructura en producción (Azure Blob, despliegue cloud) y políticas institucionales no implementadas en software.',
];

const ELEMENTOS = [
  '• Autenticación y seguridad (TC-001 a TC-004): login, JWT, acceso denegado por rol.',
  '• Pacientes y seguros (TC-005 a TC-007): alta de expediente, unicidad DPI/NIT, pólizas vigentes.',
  '• Citas (TC-008 a TC-012): agenda, solapamiento, correo, reprogramación y cancelación.',
  '• Admisiones (TC-013 a TC-017): seguro, pago en sitio, auto-atención médica, anulación.',
  '• Triage (TC-018 a TC-019): prioridad automática en emergencia, bloqueos por admisión rechazada.',
  '• Atenciones médicas (TC-020 a TC-025): filtros, visibilidad por rol, reasignación, órdenes.',
  '• Órdenes, laboratorio e imágenes (TC-026 a TC-033): auto-creación, correlativos, adjuntos.',
  '• Pagos y permisos (TC-034 a TC-039): cobertura de seguro, comprobante PDF, matriz de roles.',
  '• Reportes y E2E (TC-040 a TC-045): export CSV, flujos completos consulta, emergencia y walk-in.',
];

const FUNCIONALIDADES = [
  'Desde el punto de vista del usuario se validará: registro de pacientes con consentimiento de privacidad; gestión de pólizas de seguro; agendamiento de citas con confirmación opcional por correo; admisiones con validación financiera; triage automático en emergencias; atenciones clínicas con reasignación del médico jefe; generación de órdenes y estudios; completado de laboratorio con adjunto obligatorio; despacho farmacéutico; registro de pagos con comprobante PDF; consulta de reportes y bitácora según rol.',
  'También se verifican restricciones operativas: admisiones rechazadas o anuladas bloquean nuevas atenciones y pagos; laboratorio completado exige archivo adjunto; citas no pueden traslapar disponibilidad del médico; el menú lateral muestra únicamente módulos autorizados por rol.',
];

const GENERALIDADES =
  'Los casos de prueba especifican URL base http://localhost:4200 (frontend) y API http://localhost:8080/api. Usuarios de prueba: admin, recepcion, medico, medico-jefe, laboratorio, farmacia, cajero. Datos de entrada incluyen DPI/NIT únicos, pacientes con y sin seguro vigente, citas futuras, admisiones CONSULTA y EMERGENCIA, órdenes LAB/IMAGEN/FARMACIA y archivos PDF de resultados en ./data/uploads. La ejecución manual documenta capturas; la automatizada utiliza mvn test (JUnit/Mockito) y ng build.';

const TC013 = {
  id: 'TC-013',
  version: '1',
  fecha: META.fecha,
  escenario: 'Admisión con seguro vigente y auto-atención médica',
  modulo: 'Admisiones',
  descripcion:
    'Verificar que una admisión con seguro activo queda en estado ADMITIDO, genera atención médica pendiente asignada al médico jefe y permite continuar el flujo clínico.',
  precondiciones:
    'Usuario recepcionista autenticado. Paciente activo con póliza de seguro vigente. Cita programada opcional en estado PROGRAMADA. Backend y frontend en ejecución. Médico jefe configurado en el sistema.',
  pasos:
    '1. Ingresar a Admisiones → Nueva admisión. 2. Seleccionar paciente con seguro vigente. 3. Vincular cita si aplica. 4. Tipo CONSULTA, modalidad SEGURO. 5. Guardar admisión. 6. Verificar estado ADMITIDO en listado. 7. Ingresar como médico jefe a Atenciones médicas. 8. Confirmar atención pendiente auto-generada.',
  hallazgos: 'Sin hallazgos en ejecución de referencia documentada.',
  veredicto: 'Aprobado (pendiente firma del analista en ejecución formal UAT).',
  observaciones:
    'Caso representativo del plan maestro; la matriz completa TC-001 a TC-045 se ejecuta siguiendo la misma plantilla de caso de prueba.',
};

function applyReplacements(xml) {
  let doc = xml;

  doc = replaceParagraphContaining(doc, '[Nombre del', coverTitle(META.proyecto));
  doc = doc.replace(/\[dd\/mm\/aaa\]/g, META.fecha);

  doc = fillTableRowByLabel(doc, 'Empresa / Organización', META.organismo);
  doc = fillTableRowByLabel(doc, 'Proyecto', META.proyecto);
  doc = fillTableRowByLabel(doc, 'Fecha de preparación', META.fecha);
  doc = fillTableRowByLabel(doc, 'Cliente', META.cliente);
  doc = fillTableRowByLabel(doc, 'Patrocinador principal', META.patrocinador);
  doc = fillTableRowContaining(doc, '<w:t>royecto</w:t>', META.gerenteProyecto);
  doc = fillTableRowContaining(doc, '<w:t>oftware</w:t>', META.gerentePruebas);

  const versionRow =
    `<w:tr w:rsidR="00992E52" w:rsidTr="00992E52">` +
    `<w:tc><w:tcPr><w:tcW w:w="1085" w:type="dxa"/></w:tcPr>${cellTextSmall(META.fecha, true)}</w:tc>` +
    `<w:tc><w:tcPr><w:tcW w:w="1183" w:type="dxa"/></w:tcPr>${cellTextSmall(META.version, true)}</w:tc>` +
    `<w:tc><w:tcPr><w:tcW w:w="1843" w:type="dxa"/></w:tcPr>${cellTextSmall(META.autor, true)}</w:tc>` +
    `<w:tc><w:tcPr><w:tcW w:w="1843" w:type="dxa"/></w:tcPr>${cellTextSmall(META.organismo, true)}</w:tc>` +
    `<w:tc><w:tcPr><w:tcW w:w="2992" w:type="dxa"/></w:tcPr>${cellTextSmall(META.versionDesc, true)}</w:tc>` +
    `</w:tr>`;

  doc = doc.replace(
    /<w:tr w:rsidR="00992E52" w:rsidTr="00992E52"><w:tc><w:tcPr><w:tcW w:w="1085" w:type="dxa"\/><\/w:tcPr><w:p w:rsidR="00992E52" w:rsidRPr="00FC2034" w:rsidRDefault="00992E52" w:rsidP="00CB6EF1"><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"\/><w:jc w:val="center"\/><w:rPr><w:rFonts w:eastAsia="Times New Roman" w:cs="Arial"\/><w:b\/><w:color w:val="000000"\/><w:sz w:val="20"\/><w:szCs w:val="20"\/><w:lang w:eastAsia="es-VE"\/><\/w:rPr><\/w:pPr><\/w:p><\/w:tc><w:tc><w:tcPr><w:tcW w:w="1183" w:type="dxa"\/><\/w:tcPr><w:p w:rsidR="00992E52" w:rsidRPr="00FC2034" w:rsidRDefault="00992E52" w:rsidP="00CB6EF1"><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"\/><w:jc w:val="center"\/><w:rPr><w:rFonts w:eastAsia="Times New Roman" w:cs="Arial"\/><w:b\/><w:color w:val="000000"\/><w:sz w:val="20"\/><w:szCs w:val="20"\/><w:lang w:eastAsia="es-VE"\/><\/w:rPr><\/w:pPr><\/w:p><\/w:tc><w:tc><w:tcPr><w:tcW w:w="1843" w:type="dxa"\/><\/w:tcPr><w:p w:rsidR="00992E52" w:rsidRPr="00FC2034" w:rsidRDefault="00992E52" w:rsidP="00CB6EF1"><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"\/><w:jc w:val="center"\/><w:rPr><w:rFonts w:eastAsia="Times New Roman" w:cs="Arial"\/><w:b\/><w:color w:val="000000"\/><w:sz w:val="20"\/><w:szCs w:val="20"\/><w:lang w:eastAsia="es-VE"\/><\/w:rPr><\/w:pPr><\/w:p><\/w:tc><w:tc><w:tcPr><w:tcW w:w="1843" w:type="dxa"\/><\/w:tcPr><w:p w:rsidR="00992E52" w:rsidRPr="00FC2034" w:rsidRDefault="00992E52" w:rsidP="00CB6EF1"><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"\/><w:jc w:val="center"\/><w:rPr><w:rFonts w:eastAsia="Times New Roman" w:cs="Arial"\/><w:b\/><w:color w:val="000000"\/><w:sz w:val="20"\/><w:szCs w:val="20"\/><w:lang w:eastAsia="es-VE"\/><\/w:rPr><\/w:pPr><\/w:p><\/w:tc><w:tc><w:tcPr><w:tcW w:w="2992" w:type="dxa"\/><\/w:tcPr><w:p w:rsidR="00992E52" w:rsidRPr="00FC2034" w:rsidRDefault="00992E52" w:rsidP="00CB6EF1"><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"\/><w:jc w:val="center"\/><w:rPr><w:rFonts w:eastAsia="Times New Roman" w:cs="Arial"\/><w:b\/><w:color w:val="000000"\/><w:sz w:val="20"\/><w:szCs w:val="20"\/><w:lang w:eastAsia="es-VE"\/><\/w:rPr><\/w:pPr><\/w:p><\/w:tc><\/w:tr>/,
    versionRow,
  );

  doc = replaceParagraphContaining(
    doc,
    'Resumen de',
    RESUMEN.map((t) => bodyPara(t)).join(''),
  );

  doc = doc.replace(
    /<w:bookmarkEnd w:id="5"\/><\/w:p><w:p w:rsidR="00B97EF4" w:rsidRDefault="00B97EF4" w:rsidP="00B97EF4"><w:pPr><w:shd w:val="clear" w:color="auto" w:fill="FFFFFF"\/><w:spacing w:after="0" w:line="240" w:lineRule="auto"\/><w:rPr><w:rFonts w:ascii="Calibri" w:eastAsia="Times New Roman" w:hAnsi="Calibri"\/><w:color w:val="222222"\/><w:sz w:val="22"\/><w:lang w:eastAsia="es-VE"\/><\/w:rPr><\/w:pPr><\/w:p>/,
    `<w:bookmarkEnd w:id="5"/></w:p>${ALCANCE.map((t) => bodyPara(t)).join('')}`,
  );

  doc = replaceParagraphContaining(
    doc,
    'Listado de todos los m',
    ELEMENTOS.map((t) => bodyPara(t)).join(''),
  );

  doc = replaceParagraphContaining(
    doc,
    'Es un listado de l',
    FUNCIONALIDADES.map((t) => bodyPara(t)).join(''),
  );

  doc = doc.replace(
    'Cada conjunto de casos de prueba para cada caso de uso deberá contemplar:',
    'Cada conjunto de casos de prueba por módulo funcional deberá contemplar:',
  );
  doc = doc.replace('ELEMENTO DEL CASO DE USO', 'ELEMENTO DE PRUEBA');
  doc = doc.replace('CASO DE USO:', 'ESCENARIO FUNCIONAL:');

  doc = doc.replace(
    'Los casos de prueba deben especificar exactamente rutas, nombres de archivos, valores para los datos de entrada. ',
    GENERALIDADES + ' ',
  );
  doc = doc.replace(
    'Para asegurar que las rutas y nombres de archivos se cumplan; deberá instalarse una árbol de carpetas predefinido en la estación donde se ejecutará la prueba.',
    '',
  );

  const placeholders = {
    '&lt;Número del caso de prueba constituido [número del caso de uso]-[Numero del caso de prueba]&gt;':
      TC013.id,
    '&lt;Versión diligenciado por el analista de pruebas en el momento de ejecutarla. Este número se incrementa de 1 en 1&gt;':
      TC013.version,
    '&lt;Fecha de ejecución diligenciado por el analista de pruebas&gt;':
      TC013.fecha,
    '&lt;Identificación del caso de uso objeto de la prueba&gt;':
      TC013.escenario,
    '&lt;Nombre del modulo al que corresponde el caso de uso objeto de la prueba&gt;':
      TC013.modulo,
    '&lt;Descripción de lo que se pretende probar en el caso de prueba&gt;':
      TC013.descripcion,
    '&lt;Lista de precondiciones que deben cumplirse para realizar la prueba&gt;':
      TC013.precondiciones,
    '&lt;Pasos secuenciales que deben ser ejecutados por el analista de pruebas o usuario, ante el sistema para ejecutar la prueba debe incluir pantallas del funcionamiento&gt;':
      TC013.pasos,
    '&lt;Lista de defectos o desviaciones encontrados por el analista o usuario al ejecutar la prueba&gt;':
      TC013.hallazgos,
    '&lt;Observaciones generales del analista o usuario sobre la ejecución de la prueba&gt;':
      TC013.observaciones,
  };

  for (const [from, to] of Object.entries(placeholders)) {
    doc = doc.split(from).join(esc(to));
  }

  doc = replaceParagraphContaining(doc, '&lt;Pasos secuenciales', blueCell(TC013.pasos));

  return doc;
}

function main() {
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  const template = ensureTemplateDocx();
  const zip = new AdmZip(template);

  for (const entry of zip.getEntries()) {
    if (!/\.xml$/i.test(entry.entryName)) continue;
    let content = entry.getData().toString('utf8');
    if (entry.entryName === 'word/document.xml') {
      content = applyReplacements(content);
    } else if (entry.entryName === 'docProps/core.xml') {
      content = content
        .replace(
          /<dc:title[^>]*>[^<]*<\/dc:title>/,
          `<dc:title>Plan de Pruebas de Software — ${esc(META.proyecto)}</dc:title>`,
        )
        .replace(
          /<dc:creator[^>]*>[^<]*<\/dc:creator>/,
          `<dc:creator>${esc(META.autor)}</dc:creator>`,
        );
    }
    zip.updateFile(entry.entryName, Buffer.from(content, 'utf8'));
  }

  zip.writeZip(OUTPUT);
  console.log(`Plan de pruebas generado: ${OUTPUT}`);
}

main();
