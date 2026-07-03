import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Deployed under Tomcat's /CarmelNexus context (webapps/CarmelNexus), not domain root —
  // every asset/route reference must be prefixed to match.
  base: "/CarmelNexus/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5174,
    open: true,
  },
});
