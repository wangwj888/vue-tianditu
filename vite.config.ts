import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "~": fileURLToPath(new URL("./packages", import.meta.url))
    }
  },
  build: {
    lib: {
      entry: fileURLToPath(new URL("./packages/index.ts", import.meta.url)),
      name: "VueTianditu",
      formats: ["es", "umd"],
      fileName: format => (format === "es" ? "vue-tianditu.js" : "vue-tianditu.umd.cjs"),
      cssFileName: "style"
    },
    outDir: "lib",
    rollupOptions: { external: ["vue"], output: { globals: { vue: "Vue" }, exports: "named" } }
  }
});
