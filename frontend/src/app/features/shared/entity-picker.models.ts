/** Opción legible para autocompletes de entidades (el formulario sigue enviando el ID numérico). */
export interface EntityPickerOption {
  id: number;
  /** Texto principal visible en el campo y en la lista. */
  label: string;
  /** Línea secundaria (ID, estado, fecha, etc.). */
  sublabel?: string;
  /** Texto normalizado para filtrar al escribir. */
  searchText: string;
}
