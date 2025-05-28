import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import mdx from "@astrojs/mdx";
import deno from "@deno/astro-adapter";

export default defineConfig({
  adapter: deno(),
  integrations: [svelte(), mdx()],
});