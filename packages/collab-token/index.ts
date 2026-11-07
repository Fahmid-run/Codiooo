import { randomUUID } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";

/**
 * Shared collaboration JWT implementation.
 *
 * The web application issues tokens; the collaboration server verifies
 * them. Both sides import this package so signing and verification can
 * never drift apart. The signing secret (COLLAB_TOKEN_SECRET) is shared
 * between the two processes and never leaves them.
 */

export const COLLAB_TOKEN_ISSUER = "codiooo-web";
export const COLLAB_TOKEN_AUDIENCE = "codiooo-collab";
export const COLLAB_TOKEN_TTL_SECONDS = 300;
export const COLLAB_TOKEN_ALGORITHM = "HS256" as const;

export interface CollabTokenPayload {
  sub: string;
  roomId: string;
  iss: typeof COLLAB_TOKEN_ISSUER;
  aud: typeof COLLAB_TOKEN_AUDIENCE;
  iat: number;
  exp: number;
  jti: string;
}

export type CollabTokenErrorCode =
  | "expired"
  | "invalid"
  | "wrong-room"
  | "missing-claims";

export class CollabTokenError extends Error {
  readonly code: CollabTokenErrorCode;

  constructor(code: CollabTokenErrorCode, message: string) {
    super(message);
    this.name = "CollabTokenError";
    this.code = code;
  }
}

function secretKey(secret: string): Uint8Array {
  if (typeof secret !== "string" || secret.length < 32) {
    throw new CollabTokenError(
      "invalid",
      "COLLAB_TOKEN_SECRET must be at least 32 characters long",
    );
  }
  return new TextEncoder().encode(secret);
}

export interface SignCollabTokenInput {
  userId: string;
  roomId: string;
}

export async function signCollabToken(
  input: SignCollabTokenInput,
  secret: string,
): Promise<string> {
  if (!input.userId || !input.roomId) {
    throw new CollabTokenError(
      "missing-claims",
      "userId and roomId are required to sign a collaboration token",
    );
  }

  return new SignJWT({ roomId: input.roomId })
    .setProtectedHeader({ alg: COLLAB_TOKEN_ALGORITHM })
    .setSubject(input.userId)
    .setIssuer(COLLAB_TOKEN_ISSUER)
    .setAudience(COLLAB_TOKEN_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${COLLAB_TOKEN_TTL_SECONDS}s`)
    .setJti(randomUUID())
    .sign(secretKey(secret));
}

export async function verifyCollabToken(
  token: string,
  secret: string,
  expectedRoomId?: string,
): Promise<CollabTokenPayload> {
  let payload: Record<string, unknown>;

  try {
    const verified = await jwtVerify(token, secretKey(secret), {
      algorithms: [COLLAB_TOKEN_ALGORITHM],
      issuer: COLLAB_TOKEN_ISSUER,
      audience: COLLAB_TOKEN_AUDIENCE,
    });
    payload = verified.payload;
  } catch (error) {
    const name = (error as { name?: string })?.name;
    if (name === "JWTExpired") {
      throw new CollabTokenError("expired", "Collaboration token has expired");
    }
    throw new CollabTokenError(
      "invalid",
      "Collaboration token failed verification",
    );
  }

  const { sub, roomId } = payload;

  if (
    typeof sub !== "string" ||
    !sub ||
    typeof roomId !== "string" ||
    !roomId
  ) {
    throw new CollabTokenError(
      "missing-claims",
      "Collaboration token is missing required claims",
    );
  }

  if (expectedRoomId !== undefined && roomId !== expectedRoomId) {
    throw new CollabTokenError(
      "wrong-room",
      "Collaboration token was issued for a different room",
    );
  }

  return {
    sub,
    roomId,
    iss: payload.iss as typeof COLLAB_TOKEN_ISSUER,
    aud: payload.aud as typeof COLLAB_TOKEN_AUDIENCE,
    iat: payload.iat as number,
    exp: payload.exp as number,
    jti: payload.jti as string,
  };
}
