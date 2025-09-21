import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    basicSsl(),
    tsconfigPaths({ projects: ["./tsconfig.app.json"] }),
  ],
  // plugins: [
  //   react(),
  //   tsconfigPaths({ projects: ["./tsconfig.app.json"] }),
  // ],
  resolve: {
    dedupe: ["@react-three/fiber", "three"],
  },
});
