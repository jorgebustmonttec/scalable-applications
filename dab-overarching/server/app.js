// ================================== IMPORTS ==================================

// ------------------------- Hono -------------------------
import { Hono } from "@hono/hono";
import { cors } from "@hono/hono/cors";
import { logger } from "@hono/hono/logger";
import { cache } from "@hono/hono/cache";

// ------------------------- Postgres -------------------------
import postgres from "postgres";

// ------------------------- Redis -------------------------
import { Redis } from "ioredis";

// ------------------------- auth -------------------------
import { auth } from "./auth.js";

// ================================== CONFIG ==================================

// ------------------------- Environment Variables -------------------------
/*
  The PostgreSQL connection details come from project.env and are injected
  via Docker compose's `env_file:`.  postgres() picks them up automatically
  (PGUSER, PGPASSWORD, PGHOST, PGPORT, PGDATABASE).
*/
const app = new Hono();
const sql = postgres();

const requireAuth = async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  c.set("session", session); // store user info if you want to use it later
  return next();
};


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

// ------------------------- Auth Middleware -------------------------
app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw));


// ================================== ROUTES ==================================

// =====---------------===== Health Check =====---------------=====

// ---------- GET / ----------
// This is the root endpoint, which serves as a health check.

app.get(
  "/api",
  cache({
    cacheName: "hello-cache",
    wait: true,
  }),
);

app.get(
  "/api",
  async (c) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return c.json({ message: "Hello world!" });
  },
);

// =====---------------===== Exercises =====---------------=====
// This section handles exercise-related endpoints, including listing exercises,

// ---------- GET /api/exercises/:id ----------
// This endpoint retrieves a specific exercise by its ID.

app.get("/api/exercises/:id", async (c) => {
  const id = c.req.param("id");

  const result = await sql`
    SELECT id, title, description
    FROM exercises
    WHERE id = ${id}
  `;

  if (result.length === 0) {
    return c.notFound();
  }

  return c.json(result[0]);
});


// ---------- GET /api/exercises/:id/submissions ----------
// This endpoint retrieves all submissions for a specific exercise by its ID.

app.get("/api/exercises/:id/submissions", requireAuth, async (c) => {
  const id = c.req.param("id");

  const submissions = await sql`
    SELECT id, source_code, grading_status, grade
    FROM exercise_submissions
    WHERE exercise_id = ${id}
    ORDER BY id DESC
  `;

  return c.json(submissions);
}
);

// ---------- POST /api/exercises/:id/submissions ----------
// This endpoint allows users to submit their solutions for a specific exercise by its ID.

app.post("/api/exercises/:id/submissions",  requireAuth, async (c) => {
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





// =====---------------===== Languages =====---------------=====
// This section handles language-related endpoints, including listing languages

// ---------- GET /api/languages ----------
// This endpoint retrieves all programming languages available in the system.

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


// ---------- GET /api/languages/* ----------
// This endpoint retrieves a specific programming language by its ID.

app.get(
  "/api/languages/*",
  cache({
    cacheName: "exercises-cache",
    wait: true
  }),
);

// ---------- GET /api/languages/:id/exercises ----------
// This endpoint retrieves all exercises for a specific programming language by its ID.

app.get("/api/languages/:id/exercises", async (c) => {
  const id = c.req.param("id");
  const exercises =
    await sql`SELECT id, title, description
              FROM exercises
              WHERE language_id = ${id}
              ORDER BY id`;
  return c.json(exercises);
});

// =====---------------===== Submissions =====---------------=====

// ---------- GET /api/submissions/:id/status ----------
// This endpoint retrieves the status of a specific submission by its ID.

app.get("/api/submissions/:id/status", requireAuth, async (c) => {
  const id = c.req.param("id");

  const result = await sql`
    SELECT grading_status, grade
    FROM exercise_submissions
    WHERE id = ${id}
  `;

  if (result.length === 0) {
    return c.notFound();
  }

  return c.json(result[0]);
});

// ---------- POST /api/submissions/:id/status ----------
// This endpoint allows users to update the status of a specific submission by its ID.

app.post("/api/submissions/:id/status", requireAuth, async (c) => {
  const id = c.req.param("id");
  const { grading_status, grade } = await c.req.json();

  // Update submission status
  const result = await sql`
    UPDATE exercise_submissions
    SET grading_status = ${grading_status}, grade = ${grade}
    WHERE id = ${id}
    RETURNING id
  `;

  if (result.length === 0) {
    return c.notFound();
  }

  return c.json({ id: result[0].id });
}
);



// ========================= EXPORTS =========================

export default app;
