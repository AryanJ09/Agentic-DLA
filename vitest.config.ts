import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "scripts/**/*.test.ts",
      "packages/**/*.test.{ts,tsx}",
      "apps/**/*.test.{ts,tsx}",
      "prototypes/**/*.test.{ts,tsx}",
    ],
    exclude: ["**/node_modules/**", "**/build/**", "**/dist/**", "tests/browser/**"],
  },
});
