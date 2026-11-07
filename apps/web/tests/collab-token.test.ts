import { after, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { NextRequest } from "next/server";
import { Pool } from "pg";

// Load apps/web/.env and .env.local before importing server modules.
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

const { auth } = await import("../src/lib/auth");
const { projectServices } = await import("../modules/project/project.service");
const { roomServices } = await import("../modules/room/room.service");
const { GET } = await import("../app/api/rooms/[id]/token/route");
const { verifyCollabToken } = await import("@codiooo/collab-token");

const password = "TestPass123!";
const ownerEmail = `token-owner-${Date.now()}@example.com`;
const strangerEmail = `token-stranger-${Date.now()}@example.com`;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
let ownerCookie = "";
let strangerCookie = "";
let ownerId = "";
let strangerId = "";
let projectId = "";
let roomId = "";

async function signUp(email: string, name: string) {
  const response = await auth.api.signUpEmail({
    body: { email, password, name },
    headers: new Headers(),
    returnHeaders: true,
  });
  const cookies = response.headers.getSetCookie();
  return {
    userId: response.response.user.id,
    cookie: cookies.map((c) => c.split(";")[0]).join("; "),
  };
}

function tokenRequest(room: string, cookie?: string) {
  return new NextRequest(`http://localhost/api/rooms/${room}/token`, {
    headers: cookie ? { cookie } : {},
  });
}

describe("collaboration token endpoint", () => {
  after(async () => {
    // Cascade removes sessions/accounts; rooms/rooms' projects removed first.
    if (roomId) {
      await pool.query('DELETE FROM collaboration_rooms WHERE id = $1', [
        roomId,
      ]);
    }
    if (projectId) {
      await pool.query("DELETE FROM project WHERE id = $1", [projectId]);
    }
    await pool.query('DELETE FROM "user" WHERE email IN ($1, $2)', [
      ownerEmail,
      strangerEmail,
    ]);
    await pool.end();
  });

  it("rejects unauthenticated requests with 401", async () => {
    const response = await GET(tokenRequest("any-room"), {
      params: Promise.resolve({ id: "any-room" }),
    });
    assert.equal(response.status, 401);
  });

  it("sets up owner, project and room fixtures", async () => {
    const owner = await signUp(ownerEmail, "Token Owner");
    ownerId = owner.userId;
    ownerCookie = owner.cookie;

    const stranger = await signUp(strangerEmail, "Token Stranger");
    strangerId = stranger.userId;
    strangerCookie = stranger.cookie;

    const project = await projectServices.createProject(
      { name: "Token Project", description: "" },
      ownerId,
    );
    projectId = project.id;

    const room = await roomServices.createRoomForUser(
      { name: "Token Room", projectId },
      ownerId,
    );
    assert.ok(room && room !== "forbidden");
    roomId = room.id;
  });

  it("issues a verifiable token to an authorized user", async () => {
    const response = await GET(tokenRequest(roomId, ownerCookie), {
      params: Promise.resolve({ id: roomId }),
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Cache-Control"), "no-store");

    const body = (await response.json()) as {
      success: boolean;
      data: { token: string; roomId: string; expiresIn: number };
    };
    assert.equal(body.success, true);
    assert.equal(body.data.roomId, roomId);
    assert.equal(body.data.expiresIn, 300);

    const payload = await verifyCollabToken(
      body.data.token,
      process.env.COLLAB_TOKEN_SECRET!,
      roomId,
    );
    assert.equal(payload.sub, ownerId);
  });

  it("rejects unauthorized users with 404", async () => {
    const response = await GET(tokenRequest(roomId, strangerCookie), {
      params: Promise.resolve({ id: roomId }),
    });
    assert.equal(response.status, 404);
  });

  it("returns 404 for nonexistent rooms", async () => {
    const response = await GET(
      tokenRequest("00000000-0000-0000-0000-000000000000", ownerCookie),
      { params: Promise.resolve({ id: "00000000-0000-0000-0000-000000000000" }) },
    );
    assert.equal(response.status, 404);
  });
});
