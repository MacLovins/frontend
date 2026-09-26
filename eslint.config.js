import fs from "node:fs"

import js from "@eslint/js"
import { defineConfig, globalIgnores } from "eslint/config"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import globals from "globals"
import tseslint from "typescript-eslint"

// Bulletproof-react boundaries (SPEC §1.6): features never import each other, shared code never imports
// features or the app shell; src/app composes everything.
const features = fs
  .readdirSync("src/features", { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)

const deepRelative = {
  regex: "^\\.\\./\\.\\./",
  message: "Use the @/ alias instead of deep relative imports.",
}

export default defineConfig([
  globalIgnores([
    "dist",
    "coverage",
    "src/api/generated",
    "public/mockServiceWorker.js",
  ]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: { globals: globals.browser },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrors: "none",
        },
      ],
    },
  },
  ...features.map((feature) => ({
    files: [`src/features/${feature}/**/*.{ts,tsx}`],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: `^@/(features/(?!${feature}(/|$))|app(/|$))`,
              message:
                "Features must not import other features or the app shell; compose them in src/app.",
            },
            {
              regex: "^@/testing(/|$)",
              message: "The mock backend is for tests and dev:mock only.",
            },
            deepRelative,
          ],
        },
      ],
    },
  })),
  {
    files: ["src/{components,lib,hooks,api}/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^@/(features|app|testing)(/|$)",
              message: "Shared code must not depend on features, app or mocks.",
            },
            deepRelative,
          ],
        },
      ],
    },
  },
  {
    files: ["src/testing/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^@/(features|app)(/|$)",
              message: "The mock backend must not depend on the UI.",
            },
          ],
        },
      ],
    },
  },
  // Stock shadcn files export variants next to components; keep them diffable against the registry.
  {
    files: ["src/components/ui/**/*.tsx"],
    rules: { "react-refresh/only-export-components": "off" },
  },
  {
    files: ["**/*.test.{ts,tsx}", "src/testing/**/*.{ts,tsx}"],
    rules: { "react-refresh/only-export-components": "off" },
  },
  {
    files: ["*.config.{js,ts}", "scripts/**/*.{js,mjs,ts}"],
    languageOptions: { globals: globals.node },
  },
])
