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
/*
  The PostgreSQL connection details come from project.env and are injected
  via Docker compose's `env_file:`.  postgres() picks them up automatically
  (PGUSER, PGPASSWORD, PGHOST, PGPORT, PGDATABASE).
*/
const app = new Hono();
const sql = postgres();

// ------------------------- Redis -------------------------
let redis;
if (Deno.env.get("REDIS_HOST")) {
  redis = new Redis(
    Number.parseInt(Deno.env.get("REDIS_PORT")),
    Deno.env.get("REDIS_HOST")
  );
} else {
  redis = new Redis(6379, "redis");
}

// ------------------------- Middleware -------------------------
app.use("/*", cors());
app.use("/*", logger());


// ========================= ROUTES =========================

// ------------------------- Health Check -------------------------

app.get(
  "/",
  cache({
    cacheName: "hello-cache",
    wait: true,
  }),
);

app.get(
  "/",
  async (c) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return c.json({ message: "Hello world!" });
  },
);


// ------------------------- POST /api/exercises/:id/submissions -------------------------
app.post("/api/exercises/:id/submissions", async (c) => {
  const id = c.req.param("id");
  const { source_code } = await c.req.json();

  // Save to DB
  const result = await sql`
    INSERT INTO exercise_submissions (exercise_id, source_code)
    VALUES (${id}, ${source_code})
    RETURNING id
  `;
  const submissionId = result[0].id;

  // Add to Redis queue
  await redis.lpush("submissions", submissionId.toString());

  // Return submission ID
  return c.json({ id: submissionId });
});


// ------------------------- GET /api/languages -------------------------
app.get(
  "/api/languages",
  cache({
    cacheName: "languages-cache",   // different cache name per endpoint
    wait: true
  }),
);

app.get("/api/languages", async (c) => {
  const languages =
    await sql`SELECT id, name FROM languages ORDER BY id`;
  return c.json(languages);
});

// ------------------------- GET /api/languages/:id/exercises -------------------------
app.get(
  "/api/languages/*",
  cache({
    cacheName: "exercises-cache",
    wait: true
  }),
);


app.get("/api/languages/:id/exercises", async (c) => {
  const id = c.req.param("id");
  const exercises =
    await sql`SELECT id, title, description
              FROM exercises
              WHERE language_id = ${id}
              ORDER BY id`;
  return c.json(exercises);
});


export default app;
