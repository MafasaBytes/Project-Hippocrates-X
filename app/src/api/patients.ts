import { api } from "./client";
import type { Patient, PatientCreate } from "../types/api";

export const patientsApi = {
  list: (params?: { limit?: number; offset?: number }) =>
    api.get<Patient[]>("/api/patients", { params }).then((r) => r.data),

  create: (data: PatientCreate) =>
    api.post<Patient>("/api/patients", data).then((r) => r.data),

  get: (id: string) =>
    api.get<Patient>(`/api/patients/${id}`).then((r) => r.data),

  search: (q: string) =>
    api.get<Patient[]>("/api/patients", { params: { q } }).then((r) => r.data),
};
