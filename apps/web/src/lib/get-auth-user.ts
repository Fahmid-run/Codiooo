import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function getAuthUser(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  return session?.user ?? null;
}
