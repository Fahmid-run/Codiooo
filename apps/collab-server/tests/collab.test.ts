import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { Pool } from "pg";
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { SignJWT } from "jose";
import {
  signCollabToken,
  COLLAB_TOKEN_AUDIENCE,
  COLLAB_TOKEN_ISSUER,
} from "@codiooo/collab-token";
import { createCollabServer } from "../src/server";

const SECRET = "test-collab-secret-that-is-at-least-32-chars";
const DATABASE_URL = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString: DATABASE_URL });

const suffix = Date.now();
const userId = `test-user-${suffix}`;
const email = `collab-${suffix}@example.com`;
const projectId = `test-project-${suffix}`;
const roomId = `test-room-${suffix}`;
const otherRoomId = `test-room-other-${suffix}`;
const documentId = `test-document-${suffix}`;

let server: ReturnType<typeof createCollabServer>;
let port = 0;

async function startServer() {
  server = createCollabServer({ port: 0, collabTokenSecret: SECRET });
  await server.listen(0);
  port = server.address.port;
}

function connect(options: {
  name: string;
  token?: string | (() => Promise<string>);
}) {
  const doc = new Y.Doc();
  const provider = new HocuspocusProvider({
    url: `ws://127.0.0.1:${port}`,
    name: options.name,
    document: doc,
    token: options.token ?? null,
  });
  return { provider, doc };
}

function waitForSynced(provider: HocuspocusProvider, timeout = 5000) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("timed out waiting for sync")),
      timeout,
    );
    provider.on("synced", () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

function waitForAuthFailed(provider: HocuspocusProvider, timeout = 5000) {
  return new Promise<{ reason: string }>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("timed out waiting for authenticationFailed")),
      timeout,
    );
    provider.on("authenticationFailed", (data: { reason: string }) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

async function delay(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

before(async () => {
  await pool.query(
    'INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at) VALUES ($1, $2, $3, false, NOW(), NOW())',
    [userId, "Collab Test", email],
  );
  await pool.query(
    'INSERT INTO project (id, name, description, "projectOwnerId", "createdAt", "updatedAt") VALUES ($1, $2, \'\', $3, NOW(), NOW())',
    [projectId, "Collab Test Project", userId],
  );
  await pool.query(
    'INSERT INTO collaboration_rooms (id, name, status, "projectId", "projectOwnerId", "createdAt", "updatedAt") VALUES ($1, $2, \'ACTIVE\', $3, $4, NOW(), NOW())',
    [roomId, "Collab Test Room", projectId, userId],
  );
  await pool.query(
    'INSERT INTO collaboration_rooms (id, name, status, "projectId", "projectOwnerId", "createdAt", "updatedAt") VALUES ($1, $2, \'ACTIVE\', $3, $4, NOW(), NOW())',
    [otherRoomId, "Other Room", projectId, userId],
  );
  await pool.query(
    'INSERT INTO document (id, name, "roomId", language, "createdById", "createdAt", "updatedAt") VALUES ($1, \'main\', $2, \'TYPESCRIPT\', $3, NOW(), NOW())',
    [documentId, roomId, userId],
  );

  await startServer();
});

after(async () => {
  await server.destroy();
  // FK-safe order: document (cascades documentState), rooms, project, user.
  await pool.query("DELETE FROM document WHERE id = $1", [documentId]);
  await pool.query("DELETE FROM collaboration_rooms WHERE id IN ($1, $2)", [
    roomId,
    otherRoomId,
  ]);
  await pool.query("DELETE FROM project WHERE id = $1", [projectId]);
  await pool.query('DELETE FROM "user" WHERE id = $1', [userId]);
  await pool.end();
});

describe("collaboration server", () => {
  it("authenticates an authorized connection and syncs edits", async () => {
    const token = await signCollabToken({ userId, roomId }, SECRET);
    const { provider, doc } = connect({ name: roomId, token });

    try {
      await waitForSynced(provider);
      const syncedText = doc.getText("monaco");
      assert.equal(syncedText.toString(), "");
    } finally {
      provider.destroy();
      doc.destroy();
    }
  });

  it("rejects connections without a token", async () => {
    const { provider, doc } = connect({ name: roomId });

    try {
      const failure = await waitForAuthFailed(provider);
      assert.ok(failure.reason.length > 0);
    } finally {
      provider.destroy();
      doc.destroy();
    }
  });

  it("rejects tokens with an invalid signature", async () => {
    const token = await signCollabToken(
      { userId, roomId },
      "another-secret-that-is-also-32-chars-long",
    );
    const { provider, doc } = connect({ name: roomId, token });

    try {
      const failure = await waitForAuthFailed(provider);
      assert.equal(failure.reason, "permission-denied");
    } finally {
      provider.destroy();
      doc.destroy();
    }
  });

  it("rejects expired tokens", async () => {
    const token = await new SignJWT({ roomId })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(userId)
      .setIssuer(COLLAB_TOKEN_ISSUER)
      .setAudience(COLLAB_TOKEN_AUDIENCE)
      .setIssuedAt(Date.now() / 1000 - 10)
      .setExpirationTime(Date.now() / 1000 - 1)
      .sign(new TextEncoder().encode(SECRET));

    const { provider, doc } = connect({ name: roomId, token });

    try {
      const failure = await waitForAuthFailed(provider);
      assert.equal(failure.reason, "permission-denied");
    } finally {
      provider.destroy();
      doc.destroy();
    }
  });

  it("rejects tokens issued for a different room", async () => {
    const token = await signCollabToken({ userId, roomId }, SECRET);
    const { provider, doc } = connect({ name: otherRoomId, token });

    try {
      const failure = await waitForAuthFailed(provider);
      assert.equal(failure.reason, "permission-denied");
    } finally {
      provider.destroy();
      doc.destroy();
    }
  });

  it("persists document state and restores it after reconnect", async () => {
    const token = await signCollabToken({ userId, roomId }, SECRET);
    const first = connect({ name: roomId, token });
    await waitForSynced(first.provider);
    first.doc.getText("monaco").insert(0, "persisted-content");
    // Wait for the 2s debounce (plus margin) to flush the store.
    await delay(3200);
    first.provider.destroy();
    first.doc.destroy();

    const row = await pool.query(
      'SELECT state FROM "documentState" WHERE "documentId" = $1',
      [documentId],
    );
    assert.equal(row.rowCount, 1);

    const second = connect({ name: roomId, token });
    try {
      await waitForSynced(second.provider);
      assert.equal(second.doc.getText("monaco").toString(), "persisted-content");
    } finally {
      second.provider.destroy();
      second.doc.destroy();
    }
  });

  it("syncs concurrent edits between two clients", async () => {
    const token = await signCollabToken({ userId, roomId }, SECRET);
    const a = connect({ name: roomId, token });
    const b = connect({ name: roomId, token });

    try {
      a.doc.getText("monaco").insert(0, "from-a-");
      b.doc.getText("monaco").insert(0, "from-b-");
      await delay(1500);

      const textA = a.doc.getText("monaco").toString();
      const textB = b.doc.getText("monaco").toString();
      assert.ok(textA.includes("from-a-") && textA.includes("from-b-"));
      assert.ok(textB.includes("from-a-") && textB.includes("from-b-"));
    } finally {
      a.provider.destroy();
      a.doc.destroy();
      b.provider.destroy();
      b.doc.destroy();
    }
  });

  it("recovers persisted state after a server restart", async () => {
    const token = await signCollabToken({ userId, roomId }, SECRET);

    await server.destroy();
    await startServer();

    const { provider, doc } = connect({ name: roomId, token });
    try {
      await waitForSynced(provider);
      const content = doc.getText("monaco").toString();
      assert.ok(content.includes("persisted-content"));
    } finally {
      provider.destroy();
      doc.destroy();
    }
  });
});
