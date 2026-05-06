export interface PublicServiceItem {
  id: number;
  nombre: string;
  descripcion: string;
  tags?: string[];
}

export interface PublicSpecialtyItem {
  id: number;
  nombre: string;
  descripcion: string;
  duracionMinutos: number;
}

export interface PublicDoctorItem {
  id: number;
  nombre: string;
  especialidad: string;
  perfil: string;
  horarioReferencial?: string;
}

export type PublicSearchType = 'servicio' | 'especialidad' | 'medico';

export interface PublicSearchResult {
  type: PublicSearchType;
  title: string;
  subtitle: string;
  description: string;
  route: string;
  fragment?: string;
  keywords: string;
}
