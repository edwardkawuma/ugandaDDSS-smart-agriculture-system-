// Imports

import path from "path";
import { defineConfig } from "vite";
import react from '@vitejs/plugin-react';


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api/auth": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      "/api": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
  plugins: [
    react(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
