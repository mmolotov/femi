import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

function loadHttpsCerts(dir: string) {
  const certPath = path.resolve(dir, "certs/femi.local.pem");
  const keyPath = path.resolve(dir, "certs/femi.local-key.pem");

  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    return { cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) };
  }

  return undefined;
}

export default defineConfig(({ mode, isPreview }) => {
  const workspaceRoot = fileURLToPath(new URL("../..", import.meta.url));
  const env = loadEnv(mode, workspaceRoot, "");
  const backendUrl = env.VITE_BACKEND_URL || "http://localhost:3001";
  const webAppUrl = env.WEB_APP_URL;
  const allowedPreviewHosts = ["localhost", "127.0.0.1"];

  if (webAppUrl) {
    try {
      const parsedWebAppUrl = new URL(webAppUrl);

      if (!allowedPreviewHosts.includes(parsedWebAppUrl.hostname)) {
        allowedPreviewHosts.push(parsedWebAppUrl.hostname);
      }
    } catch {
      // Ignore invalid WEB_APP_URL during config bootstrap; runtime env validation handles it.
    }
  }

  return {
    build: {
      // Keep the browser support floor used before the Vite 8 migration.
      target: ["chrome107", "edge107", "firefox104", "safari16"],
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              { name: "telegram-vendor", test: /node_modules.*@telegram-apps/, priority: 30 },
              { name: "router-vendor", test: /node_modules.*react-router/, priority: 20 },
              { name: "react-vendor", test: /node_modules.*react/, priority: 10 },
              { name: "vendor", test: /node_modules/, priority: 0 }
            ]
          }
        }
      }
    },
    plugins: [react()],
    resolve: {
      tsconfigPaths: true
    },
    preview: {
      allowedHosts: allowedPreviewHosts,
      host: "0.0.0.0",
      port: 4173
    },
    server: {
      host: "0.0.0.0",
      // Dev server (5173) uses the femi.local certs; `vite preview` (e2e on 4173)
      // stays HTTP so Playwright's http baseURL can reach it.
      https: isPreview ? undefined : loadHttpsCerts(import.meta.dirname),
      port: 5173,
      proxy: {
        "/api": backendUrl,
        "/telegram": backendUrl
      }
    }
  };
});
