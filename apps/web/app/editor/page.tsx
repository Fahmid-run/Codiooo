"use client";
import React from "react";
import { Editor } from "@monaco-editor/react";
import CodeEditor from "@/components/editor/code-editor";
import CodeLabWorkspace from "@/components/editor/code-workspace";
import CodeLabRuntime from "@/components/editor/codelab-runtime";

function page() {
  // return <CodeLabRuntime />;
  return <CodeLabWorkspace />;
}

export default page;
