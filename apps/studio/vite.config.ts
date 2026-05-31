import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://127.0.0.1:4317",
      "/preview": "http://127.0.0.1:4317",
      "/outputs": "http://127.0.0.1:4317"
    }
  },
  build: {
    outDir: "../../dist/apps/studio",
    emptyOutDir: true
  }
});
