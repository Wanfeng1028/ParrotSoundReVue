import path from "node:path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    AutoImport({
      imports: ["vue", "vue-router", "pinia"],
      dts: "src/auto-imports.d.ts",
      eslintrc: {
        enabled: false,
      },
      resolvers: [
        ElementPlusResolver({
          importStyle: "css",
        }),
      ],
    }),
    Components({
      dts: "src/components.d.ts",
      dirs: [],
      resolvers: [
        ElementPlusResolver({
          importStyle: "css",
        }),
      ],
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    cssCodeSplit: true,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }

          if (id.includes("element-plus") || id.includes("@element-plus") || id.includes("@ctrl/tinycolor")) {
            return "ui-core";
          }

          if (id.includes("vue")) {
            return "ui-core";
          }

          if (id.includes("axios") || id.includes("vue-router") || id.includes("pinia")) {
            return "app-shell";
          }

          return "vendor";
        },
      },
    },
    reportCompressedSize: mode !== "analyze",
    sourcemap: mode === "analyze",
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
}));
