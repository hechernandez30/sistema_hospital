export const environment = {
  production: true,
  /** URL absoluta del API en producción (ajustar despliegue) */
  apiUrl: 'http://localhost:8080',

  /**
   * Datos mostrados en el aviso de privacidad (CU02). Definir valores reales por institución antes de producción.
   * @see docs/cu02_aviso_privacidad_modal.md
   */
  privacyNotice: {
    hospitalName: '[Nombre del Hospital]',
    physicalAddress: '[dirección física completa]',
    phone: '[número]',
    email: '[correo]',
  },
};
