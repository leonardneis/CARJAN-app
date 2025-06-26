import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

export default defineConfig({
  root: path.resolve(__dirname, "src/renderer"),
  publicDir: path.resolve(__dirname, "public"),
  plugins: [vue()],
  base: "./",
  build: {
    outDir: path.resolve(__dirname, "dist/renderer"),
    emptyOutDir: true,
  },
});
