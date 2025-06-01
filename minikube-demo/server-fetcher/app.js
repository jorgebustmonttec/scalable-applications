import { Hono } from "@hono/hono";
import { cors } from "@hono/hono/cors";
import { logger } from "@hono/hono/logger";

const app = new Hono();

app.use("/*", cors());
app.use("/*", logger());

app.get("/", async (c) => {
  const res = await fetch("http://minikube-demo-server-service:8000");
  const data = await res.json();

  return c.json({
    message: `Fetched: ${data.message}`,
  });
});

export default app;