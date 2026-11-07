import { db } from "@codiooo/db/src/index.js";

export async function resolvePersistableDocumentId(
  roomId: string,
): Promise<string | null> {
  const room = await db.orm.public.CollaborationRoom.where({ id: roomId })
    .select("id")
    .first();

  if (!room) return null;

  const document = await db.orm.public.Document.where({ roomId })
    .orderBy((doc) => doc.createdAt.asc())
    .select("id")
    .first();

  return document?.id ?? null;
}

export async function loadDocumentState(
  documentId: string,
): Promise<Uint8Array | null> {
  const row = await db.orm.public.DocumentState.where({ documentId })
    .select("state")
    .first();

  if (!row) return null;

  const state = row.state as unknown;
  if (state instanceof Uint8Array) return state;
  if (Buffer.isBuffer(state)) return new Uint8Array(state);
  return null;
}

export async function storeDocumentState(
  documentId: string,
  update: Uint8Array,
): Promise<void> {
  const existing = await db.orm.public.DocumentState.where({ documentId })
    .select("id")
    .first();

  if (existing) {
    await db.orm.public.DocumentState.where({ documentId }).update({
      state: update,
    });
    return;
  }

  await db.orm.public.DocumentState.create({
    documentId,
    state: update,
  });
}
