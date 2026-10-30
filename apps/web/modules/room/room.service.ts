"use server";

import { apiClient } from "@/lib/api-client";

export const roomServices = {
  async createRoom(data) {
    return await apiClient("/rooms", {
      method: "POST",
      body: data,
    });
  },
  async getRooms() {
    return await apiClient("/rooms", {
      method: "GET",
    });
  },
  async getRoomByid(id: string) {
    return await apiClient(`/rooms/${id}`, {
      method: "GET",
    });
  },
};
