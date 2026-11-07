import { z } from "zod";

export const serverEnvSchema = z.object({
  DATABASE_URL: z.url("DATABASE_URL must be a valid URL"),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET must be at least 32 characters long"),
  BETTER_AUTH_URL: z.url("BETTER_AUTH_URL must be a valid URL").optional(),
  GITHUB_CLIENT_ID: z.string().min(1, "GITHUB_CLIENT_ID is required"),
  GITHUB_CLIENT_SECRET: z.string().min(1, "GITHUB_CLIENT_SECRET is required"),
  COLLAB_TOKEN_SECRET: z
    .string()
    .min(32, "COLLAB_TOKEN_SECRET must be at least 32 characters long"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(
  source: Record<string, string | undefined>,
): ServerEnv {
  return serverEnvSchema.parse(source);
}

function loadServerEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse(process.env);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `Invalid server environment configuration:\n${issues}\n` +
        "See apps/web/.env.example for the required variables.",
    );
  }

  return result.data;
}

export const env = loadServerEnv();
