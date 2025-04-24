import { defineConfig } from "vite";
import { crx, defineManifest } from "@crxjs/vite-plugin";

const manifest = defineManifest({
  manifest_version: 3,
  name: "SVG Downloader",
  version: "1.0.0",
  description: "ページ内のSVG画像を取得してZIPでダウンロードします",
  action: {
    default_popup: "index.html",
  },
  permissions: ["activeTab", "downloads"],
  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["src/content.ts"],
    },
  ],
  background: {
    service_worker: "src/background.ts",
    type: "module",
  },
});

export default defineConfig({
  plugins: [crx({ manifest })],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
  },
});
