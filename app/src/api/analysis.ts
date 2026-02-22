import { api } from "./client";
import type {
  AnalysisRequest,
  StandaloneAnalysisRequest,
  AnalysisOut,
} from "../types/api";

export const analysisApi = {
  analyzeInConsultation: (consultationId: string, data: AnalysisRequest) =>
    api
      .post<AnalysisOut>(`/api/consultations/${consultationId}/analyze`, data)
      .then((r) => r.data),

  standalone: (data: StandaloneAnalysisRequest) =>
    api.post<AnalysisOut>("/api/analyze", data).then((r) => r.data),
};
