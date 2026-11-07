import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SignJWT } from "jose";

import {
  CollabTokenError,
  COLLAB_TOKEN_AUDIENCE,
  COLLAB_TOKEN_ISSUER,
  signCollabToken,
  verifyCollabToken,
} from "../index";

const SECRET = "test-secret-that-is-at-least-32-chars-long";
const OTHER_SECRET = "different-secret-that-is-at-least-32-chars";

async function expectCode(
  promise: Promise<unknown>,
  code: "expired" | "invalid" | "wrong-room" | "missing-claims",
) {
  await assert.rejects(promise, (error: unknown) => {
    assert.ok(error instanceof CollabTokenError);
    assert.equal((error as CollabTokenError).code, code);
    return true;
  });
}

describe("collab-token", () => {
  it("signs and verifies a token", async () => {
    const token = await signCollabToken({ userId: "u1", roomId: "r1" }, SECRET);
    assert.equal(typeof token, "string");

    const payload = await verifyCollabToken(token, SECRET, "r1");
    assert.equal(payload.sub, "u1");
    assert.equal(payload.roomId, "r1");
    assert.equal(payload.iss, COLLAB_TOKEN_ISSUER);
    assert.equal(payload.aud, COLLAB_TOKEN_AUDIENCE);
    assert.equal(typeof payload.iat, "number");
    assert.equal(typeof payload.exp, "number");
    assert.equal(typeof payload.jti, "string");
    assert.ok(payload.exp > payload.iat);
  });

  it("verifies without an expected room id", async () => {
    const token = await signCollabToken({ userId: "u1", roomId: "r1" }, SECRET);
    const payload = await verifyCollabToken(token, SECRET);
    assert.equal(payload.roomId, "r1");
  });

  it("rejects tokens for a different room", async () => {
    const token = await signCollabToken({ userId: "u1", roomId: "r1" }, SECRET);
    await expectCode(verifyCollabToken(token, SECRET, "r2"), "wrong-room");
  });

  it("rejects tokens signed with a different secret", async () => {
    const token = await signCollabToken({ userId: "u1", roomId: "r1" }, SECRET);
    await expectCode(verifyCollabToken(token, OTHER_SECRET), "invalid");
  });

  it("rejects malformed tokens", async () => {
    await expectCode(verifyCollabToken("not-a-jwt", SECRET), "invalid");
    await expectCode(verifyCollabToken("", SECRET), "invalid");
  });

  it("rejects expired tokens", async () => {
    const token = await new SignJWT({ roomId: "r1" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("u1")
      .setIssuer(COLLAB_TOKEN_ISSUER)
      .setAudience(COLLAB_TOKEN_AUDIENCE)
      .setIssuedAt(Date.now() / 1000 - 10)
      .setExpirationTime(Date.now() / 1000 - 1)
      .sign(new TextEncoder().encode(SECRET));

    await expectCode(verifyCollabToken(token, SECRET), "expired");
  });

  it("rejects tokens with the wrong issuer", async () => {
    const token = await new SignJWT({ roomId: "r1" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("u1")
      .setIssuer("someone-else")
      .setAudience(COLLAB_TOKEN_AUDIENCE)
      .setExpirationTime("5m")
      .sign(new TextEncoder().encode(SECRET));

    await expectCode(verifyCollabToken(token, SECRET), "invalid");
  });

  it("rejects tokens with the wrong audience", async () => {
    const token = await new SignJWT({ roomId: "r1" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("u1")
      .setIssuer(COLLAB_TOKEN_ISSUER)
      .setAudience("someone-else")
      .setExpirationTime("5m")
      .sign(new TextEncoder().encode(SECRET));

    await expectCode(verifyCollabToken(token, SECRET), "invalid");
  });

  it("rejects tokens using a different algorithm", async () => {
    const token = await new SignJWT({ roomId: "r1" })
      .setProtectedHeader({ alg: "HS512" })
      .setSubject("u1")
      .setIssuer(COLLAB_TOKEN_ISSUER)
      .setAudience(COLLAB_TOKEN_AUDIENCE)
      .setExpirationTime("5m")
      .sign(new TextEncoder().encode(SECRET));

    await expectCode(verifyCollabToken(token, SECRET), "invalid");
  });

  it("rejects tokens missing required claims", async () => {
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer(COLLAB_TOKEN_ISSUER)
      .setAudience(COLLAB_TOKEN_AUDIENCE)
      .setExpirationTime("5m")
      .sign(new TextEncoder().encode(SECRET));

    await expectCode(verifyCollabToken(token, SECRET), "missing-claims");
  });

  it("rejects short secrets at sign time", async () => {
    await expectCode(
      signCollabToken({ userId: "u1", roomId: "r1" }, "short"),
      "invalid",
    );
  });

  it("rejects empty userId or roomId at sign time", async () => {
    await expectCode(
      signCollabToken({ userId: "", roomId: "r1" }, SECRET),
      "missing-claims",
    );
    await expectCode(
      signCollabToken({ userId: "u1", roomId: "" }, SECRET),
      "missing-claims",
    );
  });
});
