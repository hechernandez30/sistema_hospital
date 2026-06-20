import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultApiUrl = 'https://sistemahospital-production-80d5.up.railway.app';
const apiUrl = (process.env.API_URL?.trim() || defaultApiUrl).replace(/\/+$/, '');
if (!apiUrl) {
  console.error('Falta API_URL.');
  process.exit(1);
}

if (!/^https?:\/\//i.test(apiUrl)) {
  console.error('API_URL debe ser una URL absoluta (https://...). Valor recibido:', apiUrl);
  process.exit(1);
}

const target = join(dirname(fileURLToPath(import.meta.url)), '../src/environments/environment.ts');
const content = `export const environment = {
  production: true,
  /** URL del API en producción (generado en build por scripts/write-environment.mjs). */
  apiUrl: '${apiUrl.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}',

  privacyNotice: {
    hospitalName: '[Nombre del Hospital]',
    physicalAddress: '[dirección física completa]',
    phone: '[número]',
    email: '[correo]',
  },
};
`;

writeFileSync(target, content, 'utf8');
console.log('[write-environment] environment.ts → apiUrl =', apiUrl);
