export interface PatientResponse {
  id: number;
  patientCode: string;
  firstName: string;
  lastName: string;
  dpiNit: string;
  birthDate: string;
  sex: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  privacyAccepted: boolean;
  allergies: string | null;
  conditions: string | null;
  medicalHistory: string | null;
  currentMedications: string | null;
  active: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PatientCreatePayload {
  patientCode: string;
  firstName: string;
  lastName: string;
  dpiNit: string;
  birthDate: string;
  sex: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  privacyAccepted: boolean;
  allergies: string | null;
  conditions: string | null;
  medicalHistory: string | null;
  currentMedications: string | null;
  active: boolean | null;
}

export interface PatientUpdatePayload {
  patientCode: string;
  firstName: string;
  lastName: string;
  dpiNit: string;
  birthDate: string;
  sex: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  privacyAccepted: boolean;
  allergies: string | null;
  conditions: string | null;
  medicalHistory: string | null;
  currentMedications: string | null;
  active: boolean;
}
