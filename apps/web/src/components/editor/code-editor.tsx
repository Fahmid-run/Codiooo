"use client";

import Editor from "@monaco-editor/react";
import { useState } from "react";

const starterCode = `function greet(name: string) {
  return "Hello, " + name;
}

console.log(greet("Codiooo"));
`;

export default function CodeEditor() {
  const [code, setCode] = useState(starterCode);
  const [language, setLanguage] = useState("typescript");

  return (
    <section className="overflow-hidden rounded-lg border border-zinc-700">
      <div className="flex items-center justify-between gap-3 bg-zinc-900 p-3">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="rounded bg-zinc-800 px-3 py-2 text-white"
        >
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
          <option value="json">JSON</option>
          <option value="html">HTML</option>
          <option value="css">CSS</option>
        </select>

        <button
          onClick={() => navigator.clipboard.writeText(code)}
          className="rounded bg-zinc-700 px-3 py-2 text-white"
        >
          Copy code
        </button>
      </div>

      <Editor
        height="500px"
        language={language}
        theme="vs-dark"
        value={code}
        onChange={(value) => setCode(value ?? "")}
        options={{
          fontSize: 14,
          minimap: { enabled: true },
          automaticLayout: true,
          wordWrap: "on",
          tabSize: 2,
          scrollBeyondLastLine: false,
          padding: { top: 16 },
          suggestOnTriggerCharacters: true,
        }}
      />

      <div className="border-t border-zinc-700 bg-zinc-900 px-4 py-2 text-xs text-zinc-400">
        {language.toUpperCase()} · {code.split("\n").length} lines
      </div>
    </section>
  );
}
