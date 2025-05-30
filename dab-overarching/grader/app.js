// ========================= IMPORTS =========================

// ------------------------- Hono -------------------------
import { Hono } from "@hono/hono";
import { logger } from "@hono/hono/logger";
import { cors } from "@hono/hono/cors";

// ------------------------- Redis -------------------------
import { Redis } from "ioredis";

// ------------------------- Postgres -------------------------
import postgres from "postgres";

// ========================= CONFIG =========================

const app = new Hono();
const sql = postgres();

// Redis connection (env-aware)
let redis;
if (Deno.env.get("REDIS_HOST")) {
  redis = new Redis(
    Number.parseInt(Deno.env.get("REDIS_PORT")),
    Deno.env.get("REDIS_HOST")
  );
} else {
  redis = new Redis(6379, "redis");
}

// App-level state
let consumeEnabled = false;

// ========================= GRADING LOOP =========================

const graderLoop = async () => {
  while (consumeEnabled) {
    const queueSize = await redis.llen("submissions");

    if (queueSize === 0) {
      await new Promise((r) => setTimeout(r, 250));
      continue;
    }

    const submissionId = await redis.rpop("submissions");
    if (!submissionId) continue;

    // Mark as processing
    await sql`
      UPDATE exercise_submissions
      SET grading_status = 'processing'
      WHERE id = ${submissionId}
    `;

    // Simulate grading time
    const delay = 1000 + Math.random() * 2000; // 1–3 sec
    await new Promise((r) => setTimeout(r, delay));

    const grade = Math.floor(Math.random() * 101); // 0–100

    // Mark as graded
    await sql`
      UPDATE exercise_submissions
      SET grading_status = 'graded',
          grade = ${grade}
      WHERE id = ${submissionId}
    `;
  }
};

// ========================= MIDDLEWARE =========================

app.use("/*", logger());
app.use("/*", cors());

// ========================= ROUTES =========================

// ---------- GET /grader-api/status ----------
app.get("/grader-api/status", async (c) => {
  const queueSize = await redis.llen("submissions");
  return c.json({
    queue_size: queueSize,
    consume_enabled: consumeEnabled,
  });
});

// ---------- POST /grader-api/consume/enable ----------
app.post("/grader-api/consume/enable", async (c) => {
  if (!consumeEnabled) {
    consumeEnabled = true;
    graderLoop(); // don't await, run async
  }

  return c.json({ consume_enabled: true });
});

// ---------- POST /grader-api/consume/disable ----------
app.post("/grader-api/consume/disable", async (c) => {
  consumeEnabled = false;
  return c.json({ consume_enabled: false });
});

// ========================= EXPORT =========================

export default app;
