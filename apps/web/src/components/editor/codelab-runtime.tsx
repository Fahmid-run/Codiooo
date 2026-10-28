"use client";

import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { WebContainer } from "@webcontainer/api";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { Button } from "@/components/ui/button";
import "@xterm/xterm/css/xterm.css";

let bootPromise: Promise<WebContainer> | undefined;

function getWebContainer() {
  if (!bootPromise) {
    bootPromise = WebContainer.boot().catch((error) => {
      bootPromise = undefined;
      throw error;
    });
  }

  return bootPromise;
}

export default function CodeLabRuntime() {
  const [code, setCode] = useState('console.log("Hello from CodeLab!");');
  const [status, setStatus] = useState("Starting runtime...");
  const [ready, setReady] = useState(false);

  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<Terminal | null>(null);
  const shellInput = useRef<WritableStreamDefaultWriter<string> | null>(null);
  const runtime = useRef<WebContainer | null>(null);
  const running = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let terminal: Terminal | undefined;
    let fitAddon: FitAddon | undefined;

    async function initialize() {
      if (!terminalRef.current) return;

      terminal = new Terminal({
        convertEol: true,
        cursorBlink: true,
        fontSize: 13,
        theme: {
          background: "#09090b",
          foreground: "#fafafa",
        },
      });

      fitAddon = new FitAddon();
      terminal.loadAddon(fitAddon);
      terminal.open(terminalRef.current);
      fitAddon.fit();
      terminalInstance.current = terminal;

      try {
        const container = await getWebContainer();
        if (cancelled) return;

        runtime.current = container;

        const shell = await container.spawn("jsh", [], {
          terminal: { cols: 80, rows: 24 },
        });

        if (cancelled) {
          shell.kill();
          return;
        }

        shellInput.current = shell.input.getWriter();

        terminal.onData((data) => {
          shellInput.current?.write(data).catch(() => {});
        });

        void shell.output.pipeTo(
          new WritableStream({
            write(data) {
              terminal?.write(data);
            },
          }),
        );

        terminal.write("Codiooo terminal ready.\r\n");
        setReady(true);
        setStatus("Ready");
      } catch (error) {
        if (!cancelled) {
          setStatus("Runtime failed to start");
          terminal?.writeln(
            String(error instanceof Error ? error.message : error),
          );
        }
      }
    }

    void initialize();

    const handleResize = () => fitAddon?.fit();
    window.addEventListener("resize", handleResize);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", handleResize);
      shellInput.current?.releaseLock();
      shellInput.current = null;
      terminal?.dispose();
      terminalInstance.current = null;
    };
  }, []);

  async function runCode() {
    const container = runtime.current;
    const input = shellInput.current;

    if (!container || !input || running.current) return;

    running.current = true;
    setStatus("Running");

    try {
      await container.fs.writeFile("index.js", code);
      await input.write("node ./index.js\r");
    } catch (error) {
      terminalInstance.current?.writeln(
        String(error instanceof Error ? error.message : error),
      );
    } finally {
      running.current = false;
      setStatus("Ready");
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b p-3">
        <div>
          <h1 className="font-semibold">Codioo</h1>
          <p className="text-xs text-muted-foreground">{status}</p>
        </div>

        <Button onClick={runCode} disabled={!ready}>
          ▶ Run
        </Button>
      </header>

      <div className="grid min-h-0 flex-1 grid-rows-2">
        <section className="min-h-0">
          <div className="border-b px-3 py-2 text-sm">index.js</div>
          <Editor
            height="calc(100% - 37px)"
            defaultLanguage="javascript"
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value ?? "")}
            options={{
              automaticLayout: true,
              minimap: { enabled: true },
              fontSize: 14,
            }}
          />
        </section>

        <section className="min-h-0 border-t">
          <div className="border-b px-3 py-2 text-sm">Terminal</div>
          <div
            ref={terminalRef}
            className="h-[calc(100%-37px)] overflow-hidden bg-zinc-950 p-2"
          />
        </section>
      </div>
    </div>
  );
}
