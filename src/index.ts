import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.text("This is Blogify API, Server is Up and Working");
});

export default app;
