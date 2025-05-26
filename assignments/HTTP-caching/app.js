import { Hono } from "@hono/hono";
import { serveStatic } from "@hono/hono/deno";
import { etag } from "@hono/hono/etag";
import { cache } from "@hono/hono/cache";

const app = new Hono();

app.use(
  cache({
    cacheName: "my-duck-app",
    cacheControl: "max-age=86400",
    wait: true,
  }),
);
app.use(etag());
app.use(serveStatic({ root: "./" }));

Deno.serve(app.fetch);