import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      reporter: ["text", "lcov"]
    }
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
      obsidian: new URL("./tests/mocks/obsidian.ts", import.meta.url).pathname
    }
  }
});
