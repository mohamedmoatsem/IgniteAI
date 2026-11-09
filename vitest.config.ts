import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["artifacts/api-server/src/**/*.test.ts"],
    testTimeout: 30_000,
  },
});
