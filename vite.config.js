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
    port: 3000,
    open: true,
    // Bind 0.0.0.0 (not just localhost) so other devices on the same network can reach
    // this dev server via the machine's LAN IP, e.g. http://10.30.0.239:3000.
    host: true,
  },
});
