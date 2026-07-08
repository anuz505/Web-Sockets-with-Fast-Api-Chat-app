import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    watch: {
      usePolling: true,
    },
    // This is only for local dev hai
    proxy: {
      "/auth": {
        target: "http://nginx:8080",
        changeOrigin: true,
        secure: false,
      },
      // Regex match (Vite treats a key starting with "^" as a RegExp): only
      // proxy actual API calls like /friends/allfriends. A plain "/friends"
      // prefix match would also intercept the SPA's own /friends route (the
      // Friends page) on any hard navigation/refresh, since that path starts
      // with the same prefix — sending it to the backend instead of letting
      // the SPA handle it, which 404s with a raw JSON body.
      "^/friends/.+": {
        target: "http://nginx:8080",
        changeOrigin: true,
        secure: false,
      },
      "/messages": {
        target: "http://nginx:8080",
        changeOrigin: true,
        secure: false,
      },
      "/ws": {
        target: "ws://nginx:8080",
        ws: true,
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
