import { api } from "./client";

const ML_TIMEOUT = 10 * 60 * 1000;

export interface IntelligenceResponse {
  type: string;
  patient_id: string;
  response: string;
  model: string;
  generated_at: string;
  question?: string | null;
  symptoms?: string[] | null;
  options?: string[] | null;
  error?: string | null;
}

export const patientIntelligenceApi = {
  deepDive: (patientId: string) =>
    api
      .post<IntelligenceResponse>(
        `/api/patients/${patientId}/intelligence/deep-dive`,
        {},
        { timeout: ML_TIMEOUT }
      )
      .then((r) => r.data),

  ask: (patientId: string, question: string) =>
    api
      .post<IntelligenceResponse>(
        `/api/patients/${patientId}/intelligence/ask`,
        { question },
        { timeout: ML_TIMEOUT }
      )
      .then((r) => r.data),

  differential: (patientId: string, symptoms: string[]) =>
    api
      .post<IntelligenceResponse>(
        `/api/patients/${patientId}/intelligence/differential`,
        { symptoms },
        { timeout: ML_TIMEOUT }
      )
      .then((r) => r.data),

  compareTreatments: (patientId: string, options: string[]) =>
    api
      .post<IntelligenceResponse>(
        `/api/patients/${patientId}/intelligence/compare-treatments`,
        { options },
        { timeout: ML_TIMEOUT }
      )
      .then((r) => r.data),
};
