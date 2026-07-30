import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Two projects on purpose:
 *  - `unit` runs in Node with no DOM at all, so the director engine cannot
 *    accidentally depend on `window` and still pass.
 *  - `dom` runs component and browser-storage tests in jsdom.
 */
export default defineConfig({
  plugins: [react()],
  // Vite resolves the `@/*` alias from tsconfig natively; no plugin needed.
  resolve: { tsconfigPaths: true },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["lib/**/*.test.ts", "data/**/*.test.ts"],
          exclude: ["**/*.dom.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "dom",
          environment: "jsdom",
          setupFiles: ["./vitest.setup.ts"],
          include: [
            "lib/**/*.dom.test.ts",
            "components/**/*.test.tsx",
            "app/**/*.test.tsx",
          ],
        },
      },
    ],
    // Component tests drive real user-event interactions, which are slower than
    // the 5s default allows on a loaded machine.
    testTimeout: 20000,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["lib/**/*.ts", "data/**/*.ts", "components/**/*.tsx"],
      exclude: ["**/*.test.*", "components/ui/**"],
    },
  },
});
