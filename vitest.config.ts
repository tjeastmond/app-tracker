import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./tests/unit/setup.ts"],
    include: ["tests/unit/**/*.spec.ts", "tests/unit/**/*.spec.tsx"],
    // Run tests sequentially to avoid database deadlocks
    pool: "forks",
    poolMatchGlobs: [["**/*.spec.ts", "forks"]],
    fileParallelism: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "tests/",
        "drizzle/migrations/",
        "*.config.ts",
        ".next/",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@drizzle": path.resolve(__dirname, "./drizzle"),
    },
  },
});
