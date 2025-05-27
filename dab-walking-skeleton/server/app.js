// ========================= IMPORTS =========================

// ------------------------- Hono -------------------------
import { Hono } from "@hono/hono";
import { cors } from "@hono/hono/cors";
import { logger } from "@hono/hono/logger";
import { cache } from "@hono/hono/cache";
import { serveStatic } from "@hono/hono/deno";

// ------------------------- Postgres -------------------------
import postgres from "postgres";

// ------------------------- Redis -------------------------
import { Redis } from "ioredis";

// ========================= CONFIG =========================

// ------------------------- Hono App -------------------------
const app = new Hono();

// ------------------------- Postgres -------------------------
const sql = postgres();

// ------------------------- Redis -------------------------
const redis = new Redis(6379, "redis");
/*const redisConsumer = new Redis(6379, "redis");*/
const redisProducer = new Redis(6379, "redis");

const QUEUE_NAME = "users";

/*const consume = async () => {
  while (true) {
    const result = await redisConsumer.brpop(QUEUE_NAME, 0);
    if (result) {
      const [queue, user] = result;
      const { name } = JSON.parse(user);
      await sql`INSERT INTO users (name) VALUES (${name})`;
    }
  }
};

consume();*/

// ------------------------- Replica ID -------------------------
const REPLICA_ID = crypto.randomUUID();

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

// ------------------------- Items -------------------------

const getItems = async () => {
  await new Promise((resolve) => setTimeout(resolve, 20));
  const items = Array.from(
    { length: 1000 },
    (_, i) => ({ id: i, name: `Item ${i}` }),
  );
  return items;
};

// -------------------------- rendering -------------------------

const getInitialItems = async () => {
  await new Promise((resolve) => setTimeout(resolve, 20));
  return Array.from({ length: 100 }, (_, i) => ({ id: i, name: `Item ${i}` }));
};

const getRemainingItems = async () => {
  await new Promise((resolve) => setTimeout(resolve, 20));
  return Array.from(
    { length: 900 },
    (_, i) => ({ id: i + 100, name: `Item ${i + 100}` }),
  );
};

const loadRemaining = async () => {
  const list = document.getElementById("list");
  const items = await fetch("http://localhost:8000/items/remaining");
  const json = await items.json();

  document.getElementById("last")?.remove();

  for (const item of json) {
    const li = document.createElement("li");
    li.textContent = item.name;
    list.appendChild(li);
  }
};

// ------------------------- Middleware -------------------------
app.use("/*", cors());
app.use("/*", logger());
app.use("*", async (c, next) => {
  c.res.headers.set("X-Replica-Id", REPLICA_ID);
  await next();
});
app.use("/public/*", serveStatic({ root: "." }));

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

// ------------------------- Users -------------------------

app.post("/users", async (c) => {
  const { name } = await c.req.json();
  await redisProducer.lpush(QUEUE_NAME, JSON.stringify({ name }));
  c.status(202);
  return c.body("Accepted");
});

// ------------------------- SSR -------------------------

app.get("/ssr", async (c) => {
  const items = await getItems();

  return c.html(`<html>
    <head>
    </head>
    <body>
      <ul>
        ${items.map((item) => `<li>${item.name}</li>`).join("")}
      </ul>
    </body>
  </html>`);
});


// ------------------------- items -------------------------
app.get("/items", async (c) => {
  const items = await getItems();
  return c.json(items);
});


app.get("/items/remaining", async (c) => {
  const items = await getRemainingItems();
  return c.json(items);
});

app.get("/hybrid", async (c) => {
  const items = await getInitialItems();

  return c.html(`<html>
    <head>
      <script>
        document.addEventListener("DOMContentLoaded", async () => {
          const list = document.getElementById("list");
          const items = await fetch("http://localhost:8000/items/remaining");
          const json = await items.json();
          for (const item of json) {
            const li = document.createElement("li");
            li.textContent = item.name;
            list.appendChild(li);
          }
        });
      </script>
    </head>
    <body>
      <ul id="list">
        ${items.map((item) => `<li>${item.name}</li>`).join("")}
        <li id="last">Loading...</li>
      </ul>
    </body>
  </html>`);
});

export default app;