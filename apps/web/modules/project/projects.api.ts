import { api, ApiResponse } from "@/lib/api-client";
import { Project } from "./project.types";
export const projectApi = {
  getAll: () => api<ApiResponse<Project[]>>("/projects"),

  getById: (id: string) => api<ApiResponse<Project>>(`/projects/${id}`),

  create: (payload: { name: string; description: string }) =>
    api<ApiResponse<Project>>("/projects", {
      method: "POST",
      body: payload,
    }),
};
