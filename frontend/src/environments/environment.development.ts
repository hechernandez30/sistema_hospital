export const environment = {
  production: false,
  /** Con proxy de desarrollo las peticiones van al mismo origen (vacío = relativo) */
  apiUrl: '',

  /**
   * Datos del aviso de privacidad en formulario de paciente. Sustituir en despliegue real.
   * @see docs/cu02_aviso_privacidad_modal.md
   */
  privacyNotice: {
    hospitalName: 'H&H',
    physicalAddress: 'Ciudad de Guatemala',
    phone: '1010-0000',
    email: 'contacto@hospitalhh.com',
  },
};
