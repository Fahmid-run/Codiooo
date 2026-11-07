import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { CreateRoomInput } from "../room.schema";
import type { Room } from "../room.types";

export const roomKeys = {
  all: ["rooms"] as const,
  detail: (id: string) => ["rooms", id] as const,
};

export function useRooms() {
  return useQuery({
    queryKey: roomKeys.all,
    queryFn: async () => {
      const data = await api<{ data: Room[] }>("/rooms", { method: "GET" });
      return data.data;
    },
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateRoomInput) => {
      const response = await api<{ data: Room }>("/rooms", {
        method: "POST",
        body: payload,
      });

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: roomKeys.all,
      });
    },
  });
}
