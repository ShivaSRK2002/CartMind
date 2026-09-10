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
    // Playwright output
    "playwright-report/**",
    "test-results/**",
  ]),
  {
    // The React-Compiler-oriented strictness rules that ship enabled in
    // eslint-config-next 16 flag idiomatic patterns we use deliberately
    // (one-shot localStorage hydration in a mount effect, reading a ref in a
    // render-time helper). The React Compiler is not enabled on this project,
    // so treat these as advisory rather than build-breaking.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/purity": "warn",
    },
  },
]);

export default eslintConfig;
