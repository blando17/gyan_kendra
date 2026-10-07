import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// In development /api is proxied to the Express server, so the browser sees
// one origin and there is no CORS to configure locally.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: env.VITE_PROXY_TARGET || "http://localhost:5000",
          changeOrigin: true,
        },
      },
    },
  };
});
