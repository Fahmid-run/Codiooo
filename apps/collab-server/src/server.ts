import { Server } from "@hocuspocus/server";
import * as Y from "yjs";
import { CollabTokenError, verifyCollabToken } from "@codiooo/collab-token";

import {
  loadDocumentState,
  resolvePersistableDocumentId,
  storeDocumentState,
} from "./persistence.js";

export interface CollabServerOptions {
  port: number;
  collabTokenSecret: string;
}

interface CollabContext {
  userId?: string;
}

export function createCollabServer(options: CollabServerOptions) {
  return new Server<CollabContext>({
    port: options.port,
    debounce: 2000,
    maxDebounce: 10000,

    async onAuthenticate({ token, documentName, context }) {
      if (!token) {
        throw new Error("Missing collaboration token");
      }

      try {
        const payload = await verifyCollabToken(
          token,
          options.collabTokenSecret,
          documentName,
        );
        context.userId = payload.sub;
      } catch (error) {
        if (error instanceof CollabTokenError) {
          throw new Error(
            `Collaboration token rejected (${error.code}): ${error.message}`,
          );
        }
        throw error;
      }
    },

    async onLoadDocument({ document, documentName }) {
      const documentId = await resolvePersistableDocumentId(documentName);

      if (!documentId) {
        console.log(`[collab] room ${documentName} has no Document; live-only`);
        return;
      }

      const state = await loadDocumentState(documentId);
      if (state) {
        Y.applyUpdate(document, state);
        console.log(`[collab] loaded persisted state for ${documentName}`);
      }
    },

    async onStoreDocument({ document, documentName }) {
      const documentId = await resolvePersistableDocumentId(documentName);
      if (!documentId) return;

      const update = Y.encodeStateAsUpdate(document);
      if (update.length <= 2) return;

      try {
        await storeDocumentState(documentId, update);
      } catch (error) {
        console.error(
          `[collab] failed to persist ${documentName}:`,
          error instanceof Error ? error.message : error,
        );
      }
    },

    async onConnect({ documentName, context }) {
      console.log(
        `[collab] authenticated user ${context.userId ?? "unknown"} joined ${documentName}`,
      );
    },

    async onDisconnect({ documentName, context }) {
      console.log(
        `[collab] user ${context.userId ?? "unknown"} left ${documentName}`,
      );
    },
  });
}
