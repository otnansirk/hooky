import { defineConfig } from "vite";
import vinext from "vinext";
import tailwindcss from "@tailwindcss/vite";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [
    vinext(),
    tailwindcss(),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
  environments: {
    // src/db imports cloudflare:workers lazily so Node/Docker can fall back to SQLite.
    rsc: {
      build: {
        rollupOptions: {
          external: ["cloudflare:workers"],
        },
      },
    },
  },
});
