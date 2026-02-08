import axios from "axios";
import type { JobData, JobWithFiles, FileData } from "@/types";

const api = axios.create({ baseURL: "/api" });

export const jobsApi = {
  list: (filters?: { status?: string; search?: string }) =>
    api.get<JobData[]>("/jobs", { params: filters }).then((r) => r.data),
  get: (id: string) =>
    api.get<JobWithFiles>(`/jobs/${id}`).then((r) => r.data),
  create: (formData: FormData) =>
    api.post<JobWithFiles>("/jobs", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data),
  update: (id: string, data: Partial<JobData>) =>
    api.put<JobData>(`/jobs/${id}`, data).then((r) => r.data),
  delete: (id: string) =>
    api.delete(`/jobs/${id}`).then((r) => r.data),
  addFiles: (jobId: string, formData: FormData) =>
    api.post<FileData[]>(`/jobs/${jobId}/files`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data),
};

export const filesApi = {
  downloadUrl: (id: string) => `/api/files/${id}/download`,
  delete: (id: string) =>
    api.delete(`/files/${id}`).then((r) => r.data),
};
