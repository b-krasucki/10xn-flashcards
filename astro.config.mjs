// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";
import node from "@astrojs/node";
import process from "node:process";

// Check if we're in Cloudflare environment or building for production
const isCloudflareEnv = process.env.CLOUDFLARE === "1" || process.env.NODE_ENV === "production";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: isCloudflareEnv ? ["react-dom"] : [],
    },
    resolve: {
      alias: isCloudflareEnv
        ? {
            "react-dom/server": "react-dom/server.edge",
          }
        : {},
    },
    define: {
      // Ensure React 19 works properly in different environments
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development"),
    },
  },
  adapter: isCloudflareEnv
    ? cloudflare({
        platformProxy: {
          enabled: true,
        },
      })
    : node({
        mode: "standalone",
      }),
});
