import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { loadEnv } from "vite"
import { defineConfig } from "vitest/config"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { "@": path.resolve(import.meta.dirname, "src") },
    },
    server: {
      proxy: {
        "/api": {
          // Put API_PROXY_TARGET=http://localhost:8000 in .env.development.local to use a local backend.
          target: env.API_PROXY_TARGET || "https://api.leadradar.business",
          changeOrigin: true,
          secure: true,
          // The backend rejects cookie-authenticated writes whose Origin is not its public origin
          // (core/security.py) and accepts requests with neither Origin nor Referer. The dev server is
          // same-origin for the browser, so drop both before forwarding.
          configure: (proxy) => {
            proxy.on("proxyReq", (request) => {
              request.removeHeader("origin")
              request.removeHeader("referer")
            })
          },
        },
      },
    },
    test: {
      environment: "jsdom",
      setupFiles: ["src/testing/setup.ts"],
      css: false,
    },
  }
})
