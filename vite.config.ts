import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// BASE_PATH="/morena-pratas/" no GitHub Pages; "/" no Lovable ou domínio próprio.
export default defineConfig({
  base: process.env.BASE_PATH || "/",
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
