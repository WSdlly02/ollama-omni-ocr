import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";

const chunkGroups: Record<string, string[]> = {
  vendor: ["react", "react-dom"],
  motion: ["framer-motion"],
  openai: ["openai"],
  icons: ["lucide-react"],
  markdown: ["react-markdown", "remark-gfm", "remark-math", "rehype-katex"],
  katex: ["katex"],
  syntax: ["react-syntax-highlighter"],
};

const resolveManualChunk = (moduleId: string): string | undefined => {
  if (!moduleId.includes("node_modules")) return undefined;

  for (const [chunkName, packages] of Object.entries(chunkGroups)) {
    if (packages.some((packageName) => moduleId.includes(`/node_modules/${packageName}/`))) {
      return chunkName;
    }
  }

  return undefined;
};

export default defineConfig(() => {
  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
      proxy: {
        "/ollama": {
          target: "http://localhost:11434",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ollama/, ""),
        },
      },
    },
    plugins: [react(), basicSsl()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: resolveManualChunk,
        },
      },
    },
  };
});
