"use client";

import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import * as Y from "yjs";
import { MonacoBinding } from "y-monaco";
import { HocuspocusProvider } from "@hocuspocus/provider";
import type { editor } from "monaco-editor";

interface Props {
  roomId: string;
}

export default function CollaborativeEditor({ roomId }: Props) {
  const [editorInstance, setEditorInstance] =
    useState<editor.IStandaloneCodeEditor | null>(null);

  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState(0);

  useEffect(() => {
    if (!editorInstance) return;

    const ydoc = new Y.Doc();

    const provider = new HocuspocusProvider({
      url: process.env.NEXT_PUBLIC_COLLAB_URL || "ws://localhost:1234",
      name: roomId,
      document: ydoc,
    });

    provider.awareness?.setLocalStateField("user", {
      name: "Anonymous",
      color: "#22c55e",
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

    provider.on("status", onStatus);
    provider.awareness?.on("change", onAwarenessChange);

    return () => {
      provider.off("status", onStatus);
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
          <span className={connected ? "text-green-400" : "text-yellow-400"}>
            {connected ? "Connected" : "Connecting"}
          </span>
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
