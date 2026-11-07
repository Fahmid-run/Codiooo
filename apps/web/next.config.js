/** @type {import('next').NextConfig} */
const nextConfig = {
  turbo: {
    resolveAlias: {
      "monaco-editor/esm/vs/editor/editor.api.js": "monaco-editor",
    },
  },
  async headers() {
    // Editor surfaces (WebContainer + Monaco) run cross-origin isolated
    // so the in-browser runtime can use SharedArrayBuffer.
    const isolationHeaders = [
      {
        key: "Cross-Origin-Opener-Policy",
        value: "same-origin",
      },
      {
        key: "Cross-Origin-Embedder-Policy",
        value: "require-corp",
      },
    ];

    return [
      {
        source: "/editor",
        headers: isolationHeaders,
      },
      {
        source: "/rooms/:path*",
        headers: isolationHeaders,
      },
    ];
  },
};

export default nextConfig;
