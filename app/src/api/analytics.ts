import { api } from "./client";

export interface ConsultationStats {
  period_days: number;
  total: number;
  completed: number;
  active: number;
  cancelled: number;
  completion_rate: number;
  avg_duration_minutes: number;
  by_day: Record<string, number>;
}

export interface ModalityUsage {
  counts: Record<string, number>;
  total_inputs: number;
  percentages: Record<string, number>;
}

export interface Demographics {
  total_patients: number;
  gender_distribution: Record<string, number>;
  top_cities: Record<string, number>;
  patients_with_allergies: number;
  patients_with_chronic_conditions: number;
}

export interface AiPerformance {
  period_days: number;
  total_analyses: number;
  models_used: Record<string, number>;
  total_input_tokens: number;
  total_output_tokens: number;
  avg_input_tokens: number;
  avg_output_tokens: number;
  modalities_in_context: Record<string, number>;
}

export interface DoctorActivity {
  doctor_id: string;
  doctor_name: string;
  specialization: string | null;
  total_consultations: number;
  completed_consultations: number;
  total_follow_ups: number;
  pending_follow_ups: number;
  overdue_follow_ups: number;
}

export interface RiskCohorts {
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  cohorts: Record<string, Array<{
    patient_id: string;
    name: string;
    chronic_conditions: string[];
    allergies: string[];
    risk_score: number;
  }>>;
}

export interface FollowUpStats {
  total: number;
  by_status: Record<string, number>;
  by_type: Record<string, number>;
  ai_generated: number;
  manual: number;
}

export const analyticsApi = {
  consultationStats: (params?: { days?: number; doctor_id?: string }) =>
    api.get<ConsultationStats>("/api/analytics/consultations", { params }).then((r) => r.data),

  modalityUsage: () =>
    api.get<ModalityUsage>("/api/analytics/modalities").then((r) => r.data),

  demographics: () =>
    api.get<Demographics>("/api/analytics/demographics").then((r) => r.data),

  aiPerformance: (params?: { days?: number }) =>
    api.get<AiPerformance>("/api/analytics/ai-performance", { params }).then((r) => r.data),

  doctorActivity: (doctorId: string) =>
    api.get<DoctorActivity>(`/api/analytics/doctors/${doctorId}`).then((r) => r.data),

  riskCohorts: () =>
    api.get<RiskCohorts>("/api/analytics/risk-cohorts").then((r) => r.data),

  followUpStats: () =>
    api.get<FollowUpStats>("/api/analytics/follow-ups").then((r) => r.data),
};
