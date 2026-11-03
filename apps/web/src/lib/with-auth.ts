import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/get-auth-user";
import { apiError } from "./utils";

type AuthUser = NonNullable<Awaited<ReturnType<typeof getAuthUser>>>;

export function withAuth<C = undefined>(
  handler: (
    request: NextRequest,
    user: AuthUser,
    context: C,
  ) => Response | Promise<Response>,
) {
  return async (request: NextRequest, context?: C): Promise<Response> => {
    const user = await getAuthUser(request);

    if (!user) {
      return apiError("Unauthorized", 401);
    }

    return handler(request, user, context as C);
  };
}
