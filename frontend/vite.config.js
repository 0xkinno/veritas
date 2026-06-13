// frontend/vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: ".",
  define: {
    "process.env": {},
  },
  server: { 
    port: 3000,
    strictPort: true,
    open: false
  },
});