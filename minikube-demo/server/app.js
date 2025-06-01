import { Hono } from "@hono/hono";
import { cors } from "@hono/hono/cors";
import { logger } from "@hono/hono/logger";

const app = new Hono();

const message = Deno.env.get("WELCOME_MESSAGE") || "Hello world!";

app.use("/*", cors());
app.use("/*", logger());

app.get("/", (c) => c.json({ message }));

export default app;