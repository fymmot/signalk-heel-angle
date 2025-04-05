import { defineConfig } from "vite";

export default defineConfig({
  root: "src",
  server: {
    host: true,
    port: 5173,
    open: true,
  },
  build: {
    outDir: "../dist",
    sourcemap: true,
    assetsDir: ".",
    emptyOutDir: true,
  },
  assetsInclude: ["**/*.svg"],
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
  },
});
