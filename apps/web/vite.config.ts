import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const workspaceRoot = fileURLToPath(new URL("../..", import.meta.url));
  const env = loadEnv(mode, workspaceRoot, "");
  const backendUrl = env.VITE_BACKEND_URL || "http://localhost:3001";

  return {
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) {
              return undefined;
            }

            if (id.includes("@telegram-apps")) {
              return "telegram-vendor";
            }

            if (id.includes("react-router")) {
              return "router-vendor";
            }

            if (id.includes("react")) {
              return "react-vendor";
            }

            return "vendor";
          }
        }
      }
    },
    plugins: [react(), tsconfigPaths()],
    server: {
      host: "0.0.0.0",
      port: 5173,
      proxy: {
        "/api": backendUrl,
        "/telegram": backendUrl
      }
    }
  };
});
