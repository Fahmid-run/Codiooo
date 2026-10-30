"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebContainer } from "@webcontainer/api";

import "@xterm/xterm/css/xterm.css";

import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

type ProjectFile = {
  path: string;
  language: string;
  content: string;
  kind: "html" | "css" | "javascript" | "node";
};

const INITIAL_FILES: ProjectFile[] = [
  {
    path: "index.html",
    language: "html",
    kind: "html",
    content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CodeLab</title>
    <link rel="stylesheet" href="/src/style.css" />
  </head>
  <body>
    <main class="container">
      <h1>Hello from CodeLab!</h1>
      <p>Edit the files and watch the preview update.</p>
      <button id="demo-button">Click me</button>
    </main>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>`,
  },
  {
    path: "src/style.css",
    language: "css",
    kind: "css",
    content: `body {
  margin: 0;
  padding: 32px;
  font-family: system-ui, sans-serif;
  background: #f8fafc;
  color: #0f172a;
}

.container {
  max-width: 760px;
  margin: 40px auto;
}

h1 {
  color: royalblue;
}

button {
  padding: 10px 16px;
  border: 0;
  border-radius: 8px;
  background: royalblue;
  color: white;
  cursor: pointer;
}`,
  },
  {
    path: "src/main.js",
    language: "javascript",
    kind: "javascript",
    content: `const button = document.querySelector("#demo-button");

button?.addEventListener("click", () => {
  alert("JavaScript works!");
});`,
  },
  {
    path: "server.js",
    language: "javascript",
    kind: "node",
    content: `console.log("Hello from Node.js!");
console.log("Node version:", process.version);`,
  },
];

const PACKAGE_JSON = JSON.stringify(
  {
    name: "codelab-project",
    version: "1.0.0",
    private: true,
    type: "module",
    scripts: {
      dev: "vite --host 0.0.0.0",
    },
    devDependencies: {
      vite: "^6.0.0",
    },
  },
  null,
  2,
);

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

function getLanguage(path: string) {
  if (path.endsWith(".html")) return "html";
  if (path.endsWith(".css")) return "css";
  if (path.endsWith(".json")) return "json";
  if (path.endsWith(".ts") || path.endsWith(".tsx")) return "typescript";
  if (path.endsWith(".js") || path.endsWith(".mjs")) return "javascript";
  return "plaintext";
}

function getFileIcon(path: string) {
  if (path.endsWith(".html")) return "🌐";
  if (path.endsWith(".css")) return "🎨";
  if (path.endsWith(".json")) return "📦";
  if (path.endsWith(".js")) return "🟨";
  return "📄";
}

export default function CodeLabWorkspace() {
  const [files, setFiles] = useState<ProjectFile[]>(INITIAL_FILES);
  const [activePath, setActivePath] = useState("index.html");
  const [openPaths, setOpenPaths] = useState<string[]>([
    "index.html",
    "src/style.css",
    "src/main.js",
    "server.js",
  ]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState("Starting runtime…");
  const [ready, setReady] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const runtimeRef = useRef<WebContainer | null>(null);
  const shellInputRef = useRef<WritableStreamDefaultWriter<string> | null>(
    null,
  );
  const shellProcessRef = useRef<Awaited<
    ReturnType<WebContainer["spawn"]>
  > | null>(null);
  const syncQueueRef = useRef<Promise<void>>(Promise.resolve());
  const filesRef = useRef(files);
  const readyRef = useRef(false);
  const runLockRef = useRef(false);

  // Keep the latest file contents available to asynchronous callbacks.
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  const activeFile = files.find((file) => file.path === activePath) ?? files[0];

  const updateFile = useCallback((path: string, content: string) => {
    setFiles((current) =>
      current.map((file) => (file.path === path ? { ...file, content } : file)),
    );
  }, []);

  const openFile = useCallback((path: string) => {
    setOpenPaths((current) =>
      current.includes(path) ? current : [...current, path],
    );
    setActivePath(path);
  }, []);

  const closeTab = useCallback(
    (path: string) => {
      setOpenPaths((current) => {
        const next = current.filter((item) => item !== path);

        if (activePath === path) {
          const previousIndex = current.indexOf(path) - 1;
          setActivePath(
            next[Math.max(0, previousIndex)] ?? next[0] ?? "index.html",
          );
        }

        return next;
      });
    },
    [activePath],
  );

  const writeProjectFiles = useCallback(
    async (container: WebContainer, currentFiles: ProjectFile[]) => {
      // Serialize filesystem writes so rapid edits cannot race.
      const operation = syncQueueRef.current.then(async () => {
        await container.fs.writeFile("package.json", PACKAGE_JSON);

        for (const file of currentFiles) {
          await container.fs.mkdir(
            file.path.split("/").slice(0, -1).join("/") || ".",
            { recursive: true },
          );
          await container.fs.writeFile(file.path, file.content);
        }
      });

      syncQueueRef.current = operation.catch(() => {});
      await operation;
    },
    [],
  );

  // Boot the WebContainer, install dependencies, start Vite and attach a shell.
  useEffect(() => {
    let cancelled = false;
    let terminal: Terminal | null = null;
    let shell: Awaited<ReturnType<WebContainer["spawn"]>> | null = null;
    let shellWriter: WritableStreamDefaultWriter<string> | null = null;
    let outputPipe: Promise<void> | null = null;

    async function initialize() {
      if (!terminalRef.current) return;

      terminal = new Terminal({
        convertEol: true,
        cursorBlink: true,
        fontSize: 13,
        fontFamily: "monospace",
        theme: {
          background: "#09090b",
          foreground: "#fafafa",
          cursor: "#fafafa",
        },
      });

      const fitAddon = new FitAddon();
      terminal.loadAddon(fitAddon);
      terminal.open(terminalRef.current);
      fitAddon.fit();

      terminalInstance.current = terminal;
      fitAddonRef.current = fitAddon;

      try {
        terminal.writeln("Starting CodeLab runtime…");

        const container = await getWebContainer();
        if (cancelled) return;

        runtimeRef.current = container;

        container.on("server-ready", (_port, url) => {
          if (cancelled) return;
          setPreviewUrl(url);
          setStatus("Ready");
        });

        await writeProjectFiles(container, filesRef.current);
        if (cancelled) return;

        terminal.writeln("Installing Vite dependencies…");

        const install = await container.spawn("npm", ["install"]);
        const installExitCode = await install.exit;

        if (cancelled) return;

        if (installExitCode !== 0) {
          throw new Error("npm install failed. Check the terminal output.");
        }

        terminal.writeln("Starting Vite…");

        // Do not await this process: it stays alive as the preview server.
        const devServer = await container.spawn("npm", ["run", "dev"]);
        void devServer.exit.then((exitCode) => {
          if (!cancelled && exitCode !== 0) {
            terminal?.writeln(`Vite exited with code ${exitCode}.`);
            setStatus("Vite stopped");
          }
        });

        if (cancelled) {
          devServer.kill();
          return;
        }

        shell = await container.spawn("jsh", [], {
          terminal: { cols: 100, rows: 24 },
        });

        if (cancelled) {
          shell.kill();
          return;
        }

        shellProcessRef.current = shell;
        shellWriter = shell.input.getWriter();
        shellInputRef.current = shellWriter;

        terminal.onData((data) => {
          void shellWriter?.write(data).catch(() => {});
        });

        outputPipe = shell.output.pipeTo(
          new WritableStream({
            write(data) {
              terminal?.write(data);
            },
          }),
        );

        // The shell output stream remains open for the lifetime of the shell.
        // Do not await outputPipe here.
        if (!cancelled) {
          readyRef.current = true;
          setReady(true);
          setStatus("Ready");
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : String(error);
          terminal?.writeln(`Runtime error: ${message}`);
          setStatus("Runtime failed");
        }
      }
    }

    void initialize();

    const resizeObserver = new ResizeObserver(() => {
      fitAddonRef.current?.fit();
    });

    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    return () => {
      cancelled = true;
      readyRef.current = false;
      setReady(false);

      resizeObserver.disconnect();

      try {
        shell?.kill();
      } catch {}

      try {
        shellWriter?.releaseLock();
      } catch {}

      shellInputRef.current = null;
      shellProcessRef.current = null;
      runtimeRef.current = null;

      terminal?.dispose();
      terminalInstance.current = null;
      fitAddonRef.current = null;
    };
  }, [writeProjectFiles]);

  // Keep the WebContainer filesystem synchronized with Monaco edits.
  useEffect(() => {
    if (!ready || !runtimeRef.current) return;

    const timer = window.setTimeout(() => {
      const container = runtimeRef.current;
      if (!container) return;

      void writeProjectFiles(container, files).catch((error) => {
        terminalInstance.current?.writeln(
          `File sync error: ${error instanceof Error ? error.message : String(error)}`,
        );
        setStatus("File sync failed");
      });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [files, ready, writeProjectFiles]);

  const runCode = useCallback(async () => {
    const container = runtimeRef.current;
    const terminal = terminalInstance.current;

    if (!container || !readyRef.current || runLockRef.current) return;

    runLockRef.current = true;

    try {
      setStatus("Syncing files…");
      await writeProjectFiles(container, filesRef.current);

      if (activeFile?.kind === "node") {
        setStatus("Running Node.js…");
        terminal?.writeln(`\r\n$ node ${activeFile.path}`);

        const process = await container.spawn("node", [activeFile.path]);

        const outputDone = process.output.pipeTo(
          new WritableStream({
            write(data) {
              terminal?.write(data);
            },
          }),
        );

        const exitCode = await process.exit;
        await outputDone.catch(() => {});
        terminal?.writeln(`\r\nProcess exited with code ${exitCode}`);
      } else {
        // Vite handles HTML/CSS/browser JS updates via HMR.
        setPreviewKey((current) => current + 1);
        setStatus("Preview refreshed");
      }
    } catch (error) {
      terminal?.writeln(
        `Run error: ${error instanceof Error ? error.message : String(error)}`,
      );
      setStatus("Run failed");
    } finally {
      runLockRef.current = false;
      if (readyRef.current) {
        window.setTimeout(() => setStatus("Ready"), 700);
      }
    }
  }, [activeFile, writeProjectFiles]);

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-zinc-950 p-3 text-zinc-100">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-blue-600 font-bold">
            C
          </div>
          <div>
            <h1 className="text-sm font-semibold">CodeLab</h1>
            <p className="text-xs text-zinc-500">Workspace</p>
          </div>
          <span className="ml-2 text-xs text-zinc-400">{status}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!ready}
            onClick={() => void runCode()}
          >
            ▶ Run
          </Button>
        </div>
      </header>

      <div className="min-h-0 flex-1 pt-3">
        <ResizablePanelGroup
          direction="horizontal"
          className="h-full min-h-0 rounded-lg border border-zinc-800"
        >
          {/* Explorer */}
          <ResizablePanel defaultSize={20} minSize={12} maxSize={28}>
            <aside className="flex h-full min-h-0 flex-col bg-zinc-950">
              <div className="flex h-10 shrink-0 items-center border-b border-zinc-800 px-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Explorer
              </div>

              <div className="px-3 py-3 text-xs font-semibold text-zinc-300">
                ▾ CODELAB
              </div>

              <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
                <p className="px-2 pb-1 text-xs text-zinc-500">Root</p>

                {files.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => openFile(file.path)}
                    className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm ${
                      activePath === file.path
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                    }`}
                  >
                    <span>{getFileIcon(file.path)}</span>
                    <span className="truncate">{file.path}</span>
                  </button>
                ))}
              </nav>

              <div className="border-t border-zinc-800 px-3 py-2 text-xs text-zinc-500">
                {files.length} files
              </div>
            </aside>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Editor */}
          <ResizablePanel defaultSize={38} minSize={25}>
            <section className="flex h-full min-h-0 flex-col bg-zinc-950">
              <div className="flex h-10 shrink-0 items-stretch overflow-x-auto border-b border-zinc-800">
                {openPaths.map((path) => (
                  <div
                    key={path}
                    className={`flex shrink-0 items-center border-r border-zinc-800 ${
                      activePath === path
                        ? "border-t-2 border-t-blue-500 bg-zinc-900"
                        : "text-zinc-400"
                    }`}
                  >
                    <button
                      onClick={() => setActivePath(path)}
                      className="px-3 text-xs hover:text-white"
                    >
                      {getFileIcon(path)} {path}
                    </button>
                    <button
                      aria-label={`Close ${path}`}
                      onClick={() => closeTab(path)}
                      className="mr-2 rounded px-1 text-zinc-500 hover:bg-zinc-700 hover:text-white"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className="min-h-0 flex-1">
                {activeFile ? (
                  <Editor
                    key={activeFile.path}
                    height="100%"
                    path={activeFile.path}
                    language={activeFile.language}
                    theme="vs-dark"
                    value={activeFile.content}
                    onChange={(value) =>
                      updateFile(activeFile.path, value ?? "")
                    }
                    options={{
                      automaticLayout: true,
                      minimap: { enabled: true },
                      fontSize: 14,
                      tabSize: 2,
                      wordWrap: "on",
                      scrollBeyondLastLine: false,
                      padding: { top: 12 },
                    }}
                  />
                ) : (
                  <div className="p-6 text-sm text-zinc-500">
                    Select a file from the explorer.
                  </div>
                )}
              </div>

              <div className="flex h-7 shrink-0 items-center justify-between border-t border-zinc-800 px-3 text-xs text-zinc-500">
                <span>{activeFile?.path ?? "No file selected"}</span>
                <span>{activeFile?.language ?? ""}</span>
              </div>
            </section>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Preview and terminal must be children of a vertical group. */}
          <ResizablePanel defaultSize={35} minSize={22}>
            <ResizablePanelGroup
              direction="vertical"
              className="h-full min-h-0"
            >
              <ResizablePanel defaultSize={62} minSize={25}>
                <section className="flex h-full min-h-0 flex-col bg-white">
                  <div className="flex h-10 shrink-0 items-center justify-between border-b px-3 text-xs font-semibold text-zinc-700">
                    <span>Preview</span>
                    <span className="font-normal text-zinc-500">
                      {previewUrl ? "Vite" : "Starting…"}
                    </span>
                  </div>

                  {previewUrl ? (
                    <iframe
                      key={previewKey}
                      title="CodeLab live preview"
                      src={previewUrl}
                      className="min-h-0 flex-1 border-0 bg-white"
                      sandbox="allow-scripts allow-forms allow-modals allow-popups"
                    />
                  ) : (
                    <div className="flex flex-1 items-center justify-center p-4 text-sm text-zinc-500">
                      The preview will appear when Vite is ready.
                    </div>
                  )}
                </section>
              </ResizablePanel>

              <ResizableHandle withHandle />

              <ResizablePanel defaultSize={38} minSize={18}>
                <section className="flex h-full min-h-0 flex-col bg-zinc-950">
                  <div className="flex h-9 shrink-0 items-center justify-between border-b border-zinc-800 px-3 text-xs font-semibold text-zinc-300">
                    <span>Terminal</span>
                    <button
                      className="text-zinc-500 hover:text-white"
                      onClick={() => terminalInstance.current?.clear()}
                    >
                      Clear
                    </button>
                  </div>

                  <div
                    ref={terminalRef}
                    className="min-h-0 flex-1 overflow-hidden p-2"
                  />
                </section>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
