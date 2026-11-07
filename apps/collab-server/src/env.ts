/**
 * Server environment validation for the collaboration server.
 * Fails fast at startup so a misconfigured deployment never accepts
 * unauthenticated connections.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const secret = required("COLLAB_TOKEN_SECRET");
if (secret.length < 32) {
  throw new Error("COLLAB_TOKEN_SECRET must be at least 32 characters long");
}

export const config = {
  port: Number(process.env["PORT"] ?? 1234),
  databaseUrl: required("DATABASE_URL"),
  collabTokenSecret: secret,
};
