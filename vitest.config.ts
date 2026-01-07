import * as path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/tests/unit/setup.ts"],
    css: false,
    reporters: ["verbose"],
    include: ["src/**/*.test.{ts,tsx}", "src/**/*.spec.{ts,tsx}"],
    exclude: [
      "**/node_modules/**",
      "**/e2e/**",
      "**/dist/**",
      "**/tests/unit/ui-*.test.tsx",
      "**/tests/unit/cn-utility.test.ts",
      "**/tests/unit/ipc-*.test.ts",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*"],
      exclude: [
        "**/node_modules/**",
        "**/e2e/**",
        "**/dist/**",
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "**/components/ui/**",
        "**/components/ai-elements/**",
        "**/fonts/**",
      ],
    },
  },
});
