import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type ApiResponse } from "@/lib/api-client";
import { CreateProjectInput } from "../project.schema";
import type { Project } from "../project.types";

export const projectKeys = {
  all: ["projects"] as const,
  detail: (id: string) => ["projects", id] as const,
};

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.all,
    queryFn: async () => {
      const data = await api<ApiResponse<Project[]>>("/projects", {
        method: "GET",
      });
      return data.data;
    },
  });
}
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateProjectInput) => {
      const response = await api<ApiResponse<Project>>("/projects", {
        method: "POST",
        body: payload,
      });

      return response.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: projectKeys.all,
      });
    },
  });
}
