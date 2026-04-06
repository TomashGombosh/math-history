/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
  test: {
    // happy-dom avoids jsdom→css parsing deps that break under Vitest workers on Node 22+.
    environment: "happy-dom",
    setupFiles: "./src/test/setup.ts",
    css: true,
    passWithNoTests: false,
  },
});
