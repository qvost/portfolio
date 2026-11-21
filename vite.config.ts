import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const assetBase = loadEnv(mode, process.cwd(), "VITE_").VITE_ASSET_BASE?.replace(/\/$/, "");
  return {
    plugins: [{
      name: "deadspace-asset-base",
      transformIndexHtml(html) {
        return assetBase ? html.replaceAll("https://ui.aryank.space/assets/deadspace-page", assetBase) : html;
      },
    }],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules/three")) return "three";
            if (id.includes("node_modules/gsap") || id.includes("node_modules/lenis")) return "motion";
            if (id.includes("node_modules/react") || id.includes("node_modules/scheduler")) return "react";
          },
        },
      },
    },
  };
});
