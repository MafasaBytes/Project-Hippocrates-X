import { api } from "./client";
import type {
  ConsultationCreate,
  ConsultationOut,
  ConsultationDetail,
  ConsultationEndRequest,
  ConsultationEndOut,
  InputOut,
} from "../types/api";

export const consultationsApi = {
  create: (data: ConsultationCreate) =>
    api.post<ConsultationOut>("/api/consultations", data).then((r) => r.data),

  get: (id: string) =>
    api
      .get<ConsultationDetail>(`/api/consultations/${id}`)
      .then((r) => r.data),

  list: (params?: {
    doctor_id?: string;
    patient_id?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) =>
    api
      .get<ConsultationDetail[]>("/api/consultations", { params })
      .then((r) => r.data),

  end: (id: string, data?: ConsultationEndRequest) =>
    api
      .patch<ConsultationEndOut>(`/api/consultations/${id}`, data)
      .then((r) => r.data),

  addTextInput: (id: string, raw_text: string) =>
    api
      .post<InputOut>(`/api/consultations/${id}/inputs/text`, { raw_text })
      .then((r) => r.data),

  addFileInput: (id: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api
      .post<InputOut>(`/api/consultations/${id}/inputs/file`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
};
