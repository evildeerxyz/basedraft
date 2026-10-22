import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // The template zones lint themselves.
    "templates/**",
    // What packages/ui/scripts/build.mjs writes: copies of src/registry/ui and the built package.
    "packages/ui/src/**",
    "packages/ui/dist/**",
  ]),
]);

export default eslintConfig;
