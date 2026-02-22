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

export interface Patient {
  id: string;
  name: string;
  date_of_birth: string | null;
  medical_record_number: string | null;
  created_at: string;
}

export interface PatientCreate {
  name: string;
  date_of_birth?: string | null;
  medical_record_number?: string | null;
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
