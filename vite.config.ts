import { defineConfig } from "vite";

export default defineConfig({
  server: { host: "0.0.0.0", port: 5174 },
  preview: { host: "0.0.0.0", port: 4174 },
  build: {
    rolldownOptions: {
      onLog(level, log, defaultHandler) {
        // Client directives are retained in the registry source; this build hydrates static HTML.
        if (log.code === "MODULE_LEVEL_DIRECTIVE" && log.message.includes('"use client"')) return;
        defaultHandler(level, log);
      },
    },
  },
});
