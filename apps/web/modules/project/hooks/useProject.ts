import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export const projectKeys = {
  all: ["projects"] as const,
  detail: (id: string) => ["projects", id] as const,
};

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.all,
    queryFn: async () => {
      const data = await api("/projects", { method: "GET" });
      return data.data;
    },
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: { name: string; description: string },
      projectOwnerId,
    ) => {
      const response = await api("/projects", {
        method: "POST",
        body: payload,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to create project");
      }
      return data.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: projectKeys.all,
      });
    },
  });
}
