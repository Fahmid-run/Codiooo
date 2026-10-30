import { ofetch } from "ofetch";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: unknown | null;
}

export const api = ofetch.create({
  baseURL: "/api",
  credentials: "include",

  headers: {
    Accept: "application/json",
  },

  onRequest({ options }) {
    // Add common request configuration here
  },

  onResponseError({ response }) {
    console.error(`API Error [${response.status}]:`, response._data?.message);
  },
});
