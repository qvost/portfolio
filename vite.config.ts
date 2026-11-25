import { defineConfig } from "vite";

export default defineConfig({
  server: { host: "0.0.0.0", port: 5174 },
  preview: { host: "0.0.0.0", port: 4174 },
  build: {
    rolldownOptions: {
      onLog(level, log, defaultHandler) {
        // This client-only application does not have a server/client module split.
        if (log.code === "MODULE_LEVEL_DIRECTIVE" && log.message.includes('"use client"')) return;
        defaultHandler(level, log);
      },
    },
  },
});
