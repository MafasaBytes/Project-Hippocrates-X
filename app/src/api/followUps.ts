import { api } from "./client";

export interface FollowUp {
  id: string;
  consultation_id: string;
  patient_id: string;
  doctor_id: string;
  type: string;
  description: string;
  due_date: string;
  status: string;
  ai_generated: boolean;
  ai_reasoning: string | null;
  completed_at: string | null;
  outcome_notes: string | null;
  created_at: string | null;
}

export const followUpsApi = {
  list: (params?: {
    doctor_id?: string;
    patient_id?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) =>
    api
      .get<FollowUp[]>("/api/follow-ups", { params })
      .then((r) => r.data),

  get: (id: string) =>
    api.get<FollowUp>(`/api/follow-ups/${id}`).then((r) => r.data),

  update: (id: string, data: { status?: string; outcome_notes?: string }) =>
    api.patch<FollowUp>(`/api/follow-ups/${id}`, data).then((r) => r.data),

  create: (
    consultationId: string,
    data: {
      follow_up_type: string;
      description: string;
      due_date: string;
      ai_reasoning?: string;
    }
  ) =>
    api
      .post<FollowUp>(
        `/api/consultations/${consultationId}/follow-ups`,
        data
      )
      .then((r) => r.data),

  generate: (consultationId: string) =>
    api
      .post<{ generated: number; follow_ups: FollowUp[] }>(
        `/api/consultations/${consultationId}/follow-ups/generate`,
        {},
        { timeout: 5 * 60 * 1000 }
      )
      .then((r) => r.data),
};
