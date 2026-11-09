import { fileURLToPath } from "node:url";

import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      "@femi/shared": fileURLToPath(new URL("./packages/shared/src/index.ts", import.meta.url)),
      "@femi/db": fileURLToPath(new URL("./packages/db/src/index.ts", import.meta.url))
    }
  },
  test: {
    globals: false,
    include: ["apps/**/*.test.ts", "apps/**/*.test.tsx", "packages/**/*.test.ts"],
    coverage: {
      enabled: false,
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "coverage",
      // Floor slightly below the current totals (2026-07: lines 76.9 / funcs 73.6 /
      // branches 67.1) so coverage can only ratchet up; raise when coverage grows.
      thresholds: {
        lines: 74,
        statements: 74,
        functions: 71,
        branches: 65
      },
      exclude: [
        "**/dist/**",
        "**/*.d.ts",
        "**/*.test.ts",
        "**/*.test.tsx",
        "packages/db/migrations/**",
        "apps/web/src/main.tsx"
      ]
    },
    setupFiles: ["./vitest.setup.ts"]
  }
});
