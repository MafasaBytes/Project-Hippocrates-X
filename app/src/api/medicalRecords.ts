import { api } from "./client";
import type {
  MedicalRecord,
  MedicalRecordCreate,
  RecordType,
  TimelineEntry,
} from "../types/api";

export const medicalRecordsApi = {
  create: (patientId: string, data: MedicalRecordCreate) =>
    api
      .post<MedicalRecord>(`/api/patients/${patientId}/records`, data)
      .then((r) => r.data),

  upload: (patientId: string, file: File, metadata: {
    record_type: RecordType;
    title: string;
    record_date: string;
    description?: string;
  }) => {
    const form = new FormData();
    form.append("file", file);
    form.append("record_type", metadata.record_type);
    form.append("title", metadata.title);
    form.append("record_date", metadata.record_date);
    if (metadata.description) form.append("description", metadata.description);
    return api
      .post<MedicalRecord>(`/api/patients/${patientId}/records/upload`, form)
      .then((r) => r.data);
  },

  list: (patientId: string, params?: { record_type?: RecordType; limit?: number; offset?: number }) =>
    api
      .get<MedicalRecord[]>(`/api/patients/${patientId}/records`, { params })
      .then((r) => r.data),

  get: (patientId: string, recordId: string) =>
    api
      .get<MedicalRecord>(`/api/patients/${patientId}/records/${recordId}`)
      .then((r) => r.data),

  delete: (patientId: string, recordId: string) =>
    api.delete(`/api/patients/${patientId}/records/${recordId}`),

  timeline: (patientId: string, params?: { limit?: number }) =>
    api
      .get<TimelineEntry[]>(`/api/patients/${patientId}/timeline`, { params })
      .then((r) => r.data),
};
