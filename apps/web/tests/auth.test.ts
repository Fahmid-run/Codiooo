import { after, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

const appRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const file of [".env", ".env.local"]) {
  const path = join(appRoot, file);
  if (!existsSync(path)) continue;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z_]+)\s*=\s*(.+?)\s*$/);
    const key = match?.[1];
    const value = match?.[2];
    if (key && value !== undefined && process.env[key] === undefined) {
      process.env[key] = value.replace(/^["']|["']$/g, "");
    }
  }
}

const { parseServerEnv } = await import("../src/lib/env");
const { auth } = await import("../src/lib/auth");

const VALID_ENV = {
  DATABASE_URL: "postgresql://user:pass@localhost:5433/codiooo",
  BETTER_AUTH_SECRET: "test-secret-that-is-at-least-32-chars-long",
  BETTER_AUTH_URL: "http://localhost:3000",
  GITHUB_CLIENT_ID: "github-id",
  GITHUB_CLIENT_SECRET: "github-secret",
};

describe("server environment validation", () => {
  it("accepts a complete valid environment", () => {
    const parsed = parseServerEnv(VALID_ENV);
    assert.equal(parsed.BETTER_AUTH_URL, "http://localhost:3000");
  });

  it("accepts an environment without BETTER_AUTH_URL (same-origin)", () => {
    const { BETTER_AUTH_URL: _omit, ...rest } = VALID_ENV;
    const parsed = parseServerEnv(rest);
    assert.equal(parsed.BETTER_AUTH_URL, undefined);
  });

  it("rejects a missing BETTER_AUTH_SECRET", () => {
    const { BETTER_AUTH_SECRET: _omit, ...rest } = VALID_ENV;
    assert.throws(() => parseServerEnv(rest));
  });

  it("rejects a short BETTER_AUTH_SECRET", () => {
    assert.throws(() =>
      parseServerEnv({ ...VALID_ENV, BETTER_AUTH_SECRET: "too-short" }),
    );
  });

  it("rejects missing GitHub credentials", () => {
    const {
      GITHUB_CLIENT_ID: _a,
      GITHUB_CLIENT_SECRET: _b,
      ...rest
    } = VALID_ENV;
    assert.throws(() => parseServerEnv(rest));
  });

  it("rejects a non-URL DATABASE_URL", () => {
    assert.throws(() =>
      parseServerEnv({ ...VALID_ENV, DATABASE_URL: "not-a-url" }),
    );
  });
});

function extractCookie(headers: Headers): string {
  const cookies = headers.getSetCookie();
  assert.ok(cookies.length > 0, "expected a session cookie to be set");
  return cookies.map((cookie) => cookie.split(";")[0]).join("; ");
}

describe("Better Auth live flow (dev database)", () => {
  const email = `auth-smoke-${Date.now()}@example.com`;
  const password = "TestPass123!";
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  let cookie = "";

  after(async () => {
    // Cascade (account/session FK onDelete: Cascade) removes leftovers.
    await pool.query('DELETE FROM "user" WHERE email = $1', [email]);
    await pool.end();
  });

  it("signs up and returns a session cookie", async () => {
    const response = await auth.api.signUpEmail({
      body: { email, password, name: "Smoke Test" },
      headers: new Headers(),
      returnHeaders: true,
    });

    assert.ok(response.response.user);
    assert.equal(response.response.user.email, email);
    cookie = extractCookie(response.headers);
    assert.ok(cookie.includes("better-auth.session_token"));
  });

  it("rejects a duplicate signup", async () => {
    await assert.rejects(() =>
      auth.api.signUpEmail({
        body: { email, password, name: "Smoke Test" },
        headers: new Headers(),
      }),
    );
  });

  it("retrieves the session from the cookie", async () => {
    const session = await auth.api.getSession({
      headers: new Headers({ cookie }),
    });

    assert.ok(session);
    assert.equal(session.user.email, email);
  });

  it("rejects wrong password sign-in", async () => {
    await assert.rejects(() =>
      auth.api.signInEmail({
        body: { email, password: "WrongPass123!" },
        headers: new Headers(),
      }),
    );
  });

  it("signs out and invalidates the session", async () => {
    await auth.api.signOut({ headers: new Headers({ cookie }) });

    // Bypass the 5-minute cookie cache to verify the DB session is gone.
    const session = await auth.api.getSession({
      headers: new Headers({ cookie }),
      query: { disableCookieCache: true },
    });
    assert.equal(session, null);
  });

  it("treats expired sessions as unauthenticated", async () => {
    const signIn = await auth.api.signInEmail({
      body: { email, password },
      headers: new Headers(),
      returnHeaders: true,
    });
    const freshCookie = extractCookie(signIn.headers);

    await pool.query(
      'UPDATE "session" SET expires_at = NOW() - INTERVAL \'1 hour\' WHERE user_id = (SELECT id FROM "user" WHERE email = $1)',
      [email],
    );

    const session = await auth.api.getSession({
      headers: new Headers({ cookie: freshCookie }),
      query: { disableCookieCache: true },
    });
    assert.equal(session, null);
  });

  it("returns null session without credentials", async () => {
    const session = await auth.api.getSession({
      headers: new Headers(),
    });
    assert.equal(session, null);
  });
});
