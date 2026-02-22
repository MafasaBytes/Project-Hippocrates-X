import { api } from "./client";
import type { Doctor, DoctorCreate } from "../types/api";

export const doctorsApi = {
  create: (data: DoctorCreate) =>
    api.post<Doctor>("/api/doctors", data).then((r) => r.data),

  get: (id: string) =>
    api.get<Doctor>(`/api/doctors/${id}`).then((r) => r.data),
};
