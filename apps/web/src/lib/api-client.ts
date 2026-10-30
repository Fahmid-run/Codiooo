// apps/web/src/lib/http-client.ts
import { ofetch } from "ofetch";

export const apiClient = ofetch.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
  onResponseError({ response }) {
    console.error("API Error:", response?._data);
  },
});
