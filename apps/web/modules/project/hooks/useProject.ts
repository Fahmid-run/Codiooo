import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectServices } from "../project.service";

export const projectKeys = {
  all: ["projects"] as const,
  detail: (id: string) => ["projects", id] as const,
};

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.all,
    queryFn: projectServices.getAllProject,
  });
}

export function useCreateProject(payload: any, projectOwnerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => projectServices.createProject(payload, projectOwnerId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: projectKeys.all,
      });
    },
  });
}
