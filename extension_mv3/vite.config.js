import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    base: "./", // Use relative paths for Chrome extension
    rollupOptions: {
      input: resolve(__dirname, "popup.html"),
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === "popup.html") {
            return "popup.html";
          }
          return "assets/[name].[ext]";
        },
      },
    },
  },
});

