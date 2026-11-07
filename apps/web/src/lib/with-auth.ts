import type { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/get-auth-user";
import { apiError } from "./utils";

export type AuthUser = NonNullable<Awaited<ReturnType<typeof getAuthUser>>>;

type AuthenticatedHandler<C> = (
  request: NextRequest,
  user: AuthUser,
  context: C,
) => Promise<Response>;

export function withAuth<C = undefined>(handler: AuthenticatedHandler<C>) {
  return async (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> },
  ): Promise<Response> => {
    const user = await getAuthUser(request);

    if (!user) {
      return apiError("Unauthorized", 401);
    }

    try {
      return await handler(request, user, context as unknown as C);
    } catch (error) {
      console.error("Unhandled error in authenticated route:", error);
      return apiError("Internal server error", 500);
    }
  };
}
