export type ConsultationType = "face_to_face" | "phone_call";
export type ConsultationStatus = "active" | "completed" | "cancelled";
export type InputType = "image" | "text" | "audio";

export interface Doctor {
  id: string;
  name: string;
  specialization: string | null;
  created_at: string;
}

export interface DoctorCreate {
  name: string;
  specialization?: string | null;
}

export type Gender = "male" | "female" | "other";
export type RecordType =
  | "lab_result"
  | "imaging"
  | "prescription"
  | "referral"
  | "clinical_note"
  | "other";

export interface Patient {
  id: string;
  name: string;
  date_of_birth: string | null;
  medical_record_number: string | null;
  created_at: string;
  gender: Gender | null;
  blood_type: string | null;
  phone: string | null;
  email: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  address_line: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  postal_code: string | null;
  allergies: string[] | null;
  chronic_conditions: string[] | null;
  notes: string | null;
}

export interface PatientCreate {
  name: string;
  date_of_birth?: string | null;
  medical_record_number?: string | null;
  gender?: Gender | null;
  blood_type?: string | null;
  phone?: string | null;
  email?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  address_line?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string | null;
  postal_code?: string | null;
  allergies?: string[] | null;
  chronic_conditions?: string[] | null;
  notes?: string | null;
}

export type PatientUpdate = Partial<PatientCreate>;

export interface MedicalRecord {
  id: string;
  patient_id: string;
  record_type: RecordType;
  title: string;
  description: string | null;
  file_path: string | null;
  raw_text: string | null;
  metadata_json: Record<string, unknown> | null;
  record_date: string;
  created_at: string;
}

export interface MedicalRecordCreate {
  record_type: RecordType;
  title: string;
  description?: string | null;
  raw_text?: string | null;
  metadata_json?: Record<string, unknown> | null;
  record_date: string;
}

export interface TimelineEntry {
  entry_type: "consultation" | "medical_record";
  id: string;
  date: string;
  title: string;
  status?: string;
  consultation_type?: string;
  summary?: string | null;
  record_type?: string;
  description?: string | null;
}

export interface ConsultationCreate {
  doctor_id: string;
  patient_id: string;
  consultation_type: ConsultationType;
}

export interface ConsultationOut {
  consultation_id: string;
  status: string;
  started_at: string;
  type: string;
}

export interface ConsultationDetail {
  id: string;
  doctor_id: string;
  patient_id: string;
  consultation_type: string;
  status: ConsultationStatus;
  started_at: string;
  ended_at: string | null;
  summary: string | null;
  inputs?: InputOut[];
}

export interface ConsultationEndRequest {
  generate_summary?: boolean;
}

export interface ConsultationEndOut {
  consultation_id: string;
  status: string;
  ended_at: string | null;
  summary: string | null;
}

export interface InputOut {
  input_id: string;
  type: string;
  created_at: string;
}

export interface AnalysisRequest {
  prompt: string;
  clinical_text?: string | null;
  input_id?: string | null;
}

export interface StandaloneAnalysisRequest {
  prompt: string;
  clinical_text?: string | null;
}

export interface AnalysisOut {
  analysis_id: string;
  response: string;
  model: string;
  modalities_used: string[];
}

export interface SemanticSearchRequest {
  query: string;
  limit?: number;
}

export interface SearchResult {
  consultation_id: string;
  summary: string | null;
  started_at: string;
}

export interface AnalysisSearchResult {
  analysis_id: string;
  consultation_id: string;
  prompt: string;
  result: Record<string, unknown>;
  created_at: string;
}

export interface TranscriptionResult {
  text: string;
  chunks: Array<{ text: string; timestamp: [number, number] }>;
}
