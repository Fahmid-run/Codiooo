export { cn } from "cn";

import { NextResponse } from "next/server";
import { ZodError } from "zod";

type ApiResponseOptions<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  errors?: unknown;
  status?: number;
};

export function apiResponse<T>({
  success = true,
  message = "Request successful",
  data = null as T,
  errors = null,
  status = 200,
}: ApiResponseOptions<T> = {}) {
  return NextResponse.json(
    {
      success,
      message,
      data,
      errors,
    },
    { status },
  );
}

export function apiError(
  message = "Something went wrong",
  status = 500,
  errors: unknown = null,
) {
  return apiResponse({
    success: false,
    message,
    errors,
    status,
  });
}

export function handleApiError(error: unknown): Response {
  if (error instanceof ZodError) {
    return apiError("Validation failed", 400, error.issues);
  }

  if (error instanceof SyntaxError) {
    return apiError("Invalid JSON body", 400);
  }

  console.error("Unhandled API error:", error);
  return apiError("Internal server error", 500);
}
