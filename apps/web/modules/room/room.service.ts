"use server";

import { api } from "@/lib/api-client";

export const roomServices = {
  async createRoom(data) {
    return await api("/rooms", {
      method: "POST",
      body: data,
    });
  },
  async getRooms() {
    return await api("/rooms", {
      method: "GET",
    });
  },
  async getRoomByid(id: string) {
    return await api(`/rooms/${id}`, {
      method: "GET",
    });
  },
};
