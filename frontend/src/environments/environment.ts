export const environment = {
  production: true,
  /** Backend Railway — producción */
  apiUrl: 'https://sistemahospital-production-80d5.up.railway.app',

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
