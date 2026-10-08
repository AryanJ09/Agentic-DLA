import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["**/build/**", "**/dist/**", "**/storybook-static/**", ".ai/**", "node_modules/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
);
