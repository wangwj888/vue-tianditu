import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "~": fileURLToPath(new URL("./packages", import.meta.url)) } },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts"],
    restoreMocks: true,
    clearMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text"],
      include: [
        "packages/use/**/*.ts",
        "packages/locale/**/*.ts",
        "packages/utils/coords.ts",
        "packages/overlay/markerClusterer/use/watch.ts",
        "packages/overlay/cloudMarkerCollection/use/watch.ts"
      ],
      thresholds: { lines: 70, functions: 70, statements: 70, branches: 60 }
    }
  }
});
