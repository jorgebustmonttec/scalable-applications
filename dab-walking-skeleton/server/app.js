// ========================= IMPORTS =========================

// ------------------------- Hono -------------------------
import { Hono } from "@hono/hono";
import { cors } from "@hono/hono/cors";
import { logger } from "@hono/hono/logger";
import { cache } from "@hono/hono/cache";

// ------------------------- Postgres -------------------------
import postgres from "postgres";

// ------------------------- Redis -------------------------
import { Redis } from "ioredis";

// ========================= CONFIG =========================

// ------------------------- Environment Variables -------------------------
const app = new Hono();
const sql = postgres();
const redis = new Redis(6379, "redis");

const redisCacheMiddleware = async (c, next) => {
  const cachedResponse = await redis.get(c.req.url);
  if (cachedResponse) {
    const res = JSON.parse(cachedResponse);
    return Response.json(res.json, res);
  }

  await next();

  if (!c.res.ok) {
    return;
  }

  const clonedResponse = c.res.clone();

  const res = {
    status: clonedResponse.status,
    statusText: clonedResponse.statusText,
    headers: Object.fromEntries(clonedResponse.headers),
    json: await clonedResponse.json(),
  };

  await redis.set(c.req.url, JSON.stringify(res));
};

const REPLICA_ID = crypto.randomUUID();

// ------------------------- Middleware -------------------------
app.use("/*", cors());
app.use("/*", logger());
app.use("*", async (c, next) => {
  c.res.headers.set("X-Replica-Id", REPLICA_ID);
  await next();
});


// ========================= ROUTES =========================

// ------------------------- Health Check -------------------------
/*app.get(
  "/",
  cache({
    cacheName: "hello-cache",
    wait: true,
  }),
);*/

app.get(
  "/",
  /*async*/ (c) => {
    //await new Promise((resolve) => setTimeout(resolve, 1000));
    return c.json({ message: "Hello world!" });
  },
);

// ------------------------- Hello -------------------------
app.get(
  "/hello/*",
  redisCacheMiddleware,
);

app.get(
  "/hello/:name",
  async (c) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return c.json({ message: `Hello ${c.req.param("name")}!` });
  },
);

app.post(
  "/", async (c) => {
    await caches.delete("hello-cache");
    return c.json({ message: "Cache cleared!" });
  },
);

// ------------------------- Redis -------------------------

app.get("/redis-test", async (c) => {
  let count = await redis.get("test");
  if (!count) {
    count = 0;
  } else {
    count = Number(count);
  }

  count++;

  await redis.set("test", count);
  return c.json({ count });
});


// ------------------------- Todos -------------------------
app.get("/todos", async (c) => {
  const todos = await sql`SELECT * FROM todos`;
  return c.json(todos);
});

export default app;