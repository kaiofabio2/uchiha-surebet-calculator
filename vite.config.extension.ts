import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Build da UI da calculadora como bundle IIFE independente para a extensão
export default defineConfig({
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "extension",
    emptyOutDir: false,
    copyPublicDir: false,
    emptyOutDir: false,
    cssCodeSplit: false,
    lib: {
      entry: path.resolve(__dirname, "extension/src/main.tsx"),
      name: "MadaraSurebet",
      formats: ["iife"],
      fileName: () => "calculator.iife.js",
    },
    rollupOptions: {
      output: {
        assetFileNames: (asset) =>
          asset.name && asset.name.endsWith(".css")
            ? "calculator.css"
            : "assets/[name]-[hash][extname]",
        inlineDynamicImports: true,
      },
    },
  },
});
