"use client";

import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import * as Y from "yjs";
import { MonacoBinding } from "y-monaco";
import { HocuspocusProvider } from "@hocuspocus/provider";
import type { editor } from "monaco-editor";
import { api } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";
import { toast } from "@/components/ui/toast";

interface Props {
  roomId: string;
}

const awarenessColors = [
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#f59e0b",
  "#ef4444",
  "#14b8a6",
];

function colorForUser(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return awarenessColors[hash % awarenessColors.length] as string;
}

export default function CollaborativeEditor({ roomId }: Props) {
  const [editorInstance, setEditorInstance] =
    useState<editor.IStandaloneCodeEditor | null>(null);

  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState(0);
  const [authError, setAuthError] = useState<string | null>(null);
  const { data: session } = authClient.useSession();
  const sessionRef = useRef(session);
  sessionRef.current = session;

  useEffect(() => {
    if (!editorInstance) return;

    const ydoc = new Y.Doc();

    const fetchCollabToken = async () => {
      const response = await api<{ data: { token: string } }>(
        `/rooms/${roomId}/token`,
        { method: "GET" },
      );
      return response.data.token;
    };

    const provider = new HocuspocusProvider({
      url: process.env.NEXT_PUBLIC_COLLAB_URL || "ws://localhost:1234",
      name: roomId,
      document: ydoc,
      token: async () => fetchCollabToken(),
    });

    const currentUser = sessionRef.current?.user;
    provider.awareness?.setLocalStateField("user", {
      name: currentUser?.name ?? "Collaborator",
      color: currentUser ? colorForUser(currentUser.id) : "#22c55e",
    });

    const yText = ydoc.getText("monaco");
    const model = editorInstance.getModel();

    const binding = model
      ? new MonacoBinding(
          yText,
          model,
          new Set([editorInstance]),
          provider.awareness,
        )
      : undefined;

    const onStatus = ({ status }: { status: string }) => {
      setConnected(status === "connected");
    };

    const onAwarenessChange = () => {
      setUsers(provider.awareness?.getStates().size ?? 0);
    };

    const onAuthenticationFailed = () => {
      setAuthError("You don't have access to this room.");
      toast.add({
        title: "Could not join this room: access denied or token expired.",
        type: "error",
      });
    };

    provider.on("status", onStatus);
    provider.on("authenticationFailed", onAuthenticationFailed);
    provider.awareness?.on("change", onAwarenessChange);

    return () => {
      provider.off("status", onStatus);
      provider.off("authenticationFailed", onAuthenticationFailed);
      provider.awareness?.off("change", onAwarenessChange);
      binding?.destroy();
      provider.destroy();
      ydoc.destroy();
    };
  }, [roomId, editorInstance]);

  return (
    <div className="flex h-full flex-col bg-[#1e1e1e]">
      <header className="flex h-12 items-center justify-between border-b border-white/10 px-4">
        <div className="flex gap-3 text-sm text-white">
          <span className="font-semibold">Codiooo</span>
          <span className="text-gray-400">{roomId}</span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="text-gray-400">{users} online</span>
          {authError ? (
            <span className="text-red-400">{authError}</span>
          ) : (
            <span className={connected ? "text-green-400" : "text-yellow-400"}>
              {connected ? "Connected" : "Connecting"}
            </span>
          )}
        </div>
      </header>

      <div className="min-h-0 flex-1">
        <Editor
          height="100%"
          theme="vs-dark"
          language="javascript"
          defaultValue="// Welcome to Codiooo"
          onMount={(instance) => setEditorInstance(instance)}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            automaticLayout: true,
            tabSize: 2,
            padding: { top: 16 },
          }}
        />
      </div>
    </div>
  );
}
