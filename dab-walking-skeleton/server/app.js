// ========================= IMPORTS =========================

// ------------------------- Hono -------------------------
import { Hono } from "@hono/hono";
import { cors } from "@hono/hono/cors";
import { logger } from "@hono/hono/logger";
import { cache } from "@hono/hono/cache";

// ------------------------- Postgres -------------------------
import postgres from "postgres";

// ========================= CONFIG =========================

// ------------------------- Environment Variables -------------------------
/*
  The PostgreSQL connection details come from project.env and are injected
  via Docker compose's `env_file:`.  postgres() picks them up automatically
  (PGUSER, PGPASSWORD, PGHOST, PGPORT, PGDATABASE).
*/
const app = new Hono();
const sql = postgres();

// ------------------------- Middleware -------------------------
app.use("/*", cors());
app.use("/*", logger());

// ========================= ROUTES =========================

// ------------------------- GET /api/languages -------------------------
app.get(
  "/api/languages",
  cache({ cacheName: "languages-cache", wait: true }),
  async (c) => {
    const languages =
      await sql`SELECT id, name FROM languages ORDER BY id`;
    return c.json(languages);
  },
);

// ------------------------- GET /api/languages/:id/exercises -------------------------
app.get(
  "/api/languages/:id/exercises",
  cache({ cacheName: "exercises-cache", wait: true }),
  async (c) => {
    const id = c.req.param("id");
    const exercises =
      await sql`SELECT id, title, description
                FROM exercises
                WHERE language_id = ${id}
                ORDER BY id`;
    return c.json(exercises);
  },
);


export default app;
