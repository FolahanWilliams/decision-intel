import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated agent skill files:
    ".agent/**",
    // Script files:
    "scripts/**",
    // Browser extension (minified vendor bundles):
    "extension/**",
    "extension 2/**",
    // Minified vendor bundles served from /public:
    "public/**",
  ]),
  {
    files: ["src/app/(platform)/documents/[id]/page.tsx"],
    rules: {
      "react/no-unescaped-entities": "off"
    }
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }]
    }
  },
  ...nextVitals,
  ...nextTs
]);

export default eslintConfig;
