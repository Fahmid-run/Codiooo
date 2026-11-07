import { COLLAB_TOKEN_AUDIENCE, COLLAB_TOKEN_ISSUER } from ".";

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
  "expired" | "invalid" | "wrong-room" | "missing-claims";

export interface SignCollabTokenInput {
  userId: string;
  roomId: string;
}
