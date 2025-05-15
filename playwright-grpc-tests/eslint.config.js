// eslint.config.js
import globals from "globals";
import js from "@eslint/js";
import playwright from "eslint-plugin-playwright";
import eslintConfigPrettier from "eslint-config-prettier"; // Ensures Prettier rules don't conflict

export default [
  // Base configuration for all JavaScript files
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module", // Use ESM
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    files: ["**/*.js", "**/*.mjs"],
    rules: {
      "prefer-const": "error",
      "no-unused-vars": "warn",
      // Add other project-specific or preferred rules
    },
  },
  // Playwright specific configuration
  {
    files: ["tests/**/*.js", "tests/**/*.mjs"], // Target your test files
    ...playwright.configs["flat/recommended"], // Use recommended flat config from plugin
    rules: {
      ...playwright.configs["flat/recommended"].rules,
      "playwright/expect-expect": "warn", // Example: relax rule to warning
      "playwright/no-focused-test": "error",
    },
  },
  eslintConfigPrettier, // Add Prettier config last to disable conflicting ESLint rules
]; 