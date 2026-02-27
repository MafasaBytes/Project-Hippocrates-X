import { api } from "./client";
import type {
  AnalysisRequest,
  StandaloneAnalysisRequest,
  AnalysisOut,
} from "../types/api";

// ML inference can take minutes (model download on first call + generation)
const ML_TIMEOUT = 10 * 60 * 1000; // 10 minutes

export const analysisApi = {
  analyzeInConsultation: (consultationId: string, data: AnalysisRequest) =>
    api
      .post<AnalysisOut>(`/api/consultations/${consultationId}/analyze`, data, {
        timeout: ML_TIMEOUT,
      })
      .then((r) => r.data),

  standalone: (data: StandaloneAnalysisRequest) =>
    api
      .post<AnalysisOut>("/api/analyze", data, { timeout: ML_TIMEOUT })
      .then((r) => r.data),
};
