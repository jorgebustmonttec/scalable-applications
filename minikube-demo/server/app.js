import { Hono } from "@hono/hono";
import { cors } from "@hono/hono/cors";
import { logger } from "@hono/hono/logger";
import postgres from "postgres";

const app = new Hono();
const sql = postgres();

const message = Deno.env.get("WELCOME_MESSAGE") || "Hello world!";

app.use("/*", cors());
app.use("/*", logger());

app.get("/", (c) => c.json({ message }));
app.get("/items", async (c) => {
  const items = await sql`SELECT * FROM items`;
  return c.json(items);
});

app.post("/items", async (c) => {
  const { name } = await c.req.json();
  const item = await sql`INSERT INTO items (name) VALUES (${name}) RETURNING *`;
  return c.json(item);
});

export default app;