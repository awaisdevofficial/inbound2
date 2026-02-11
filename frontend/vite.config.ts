import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Replace webhook_auth module (server-side only) with a browser-compatible stub
      "retell-sdk/lib/webhook_auth.mjs": path.resolve(__dirname, "./src/stubs/webhook_auth.ts"),
      "retell-sdk/lib/webhook_auth": path.resolve(__dirname, "./src/stubs/webhook_auth.ts"),
    },
  },
});
