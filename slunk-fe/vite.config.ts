import { resolve } from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// The backend (slunk-be) serves the API and the files' bytes
const proxy = {
  "/graphql": "http://127.0.0.1:4000",
  "/files": "http://127.0.0.1:4000",
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
    },
  },
  server: { proxy },
  preview: { proxy },
})
