import { OpenAPIHono } from "@hono/zod-openapi";
import { mainRouter } from "./routes";
import { swaggerUI } from "@hono/swagger-ui";

const app = new OpenAPIHono();

app.get("/", (c) => {
  return c.text("This is Blogify API, Server is Up and Working");
});

app.route("/api", mainRouter);

app.doc("/docs/json", {
  openapi: "3.0.0",
  info: {
    title: "Blogify API",
    version: "1.0",
    description: "Blogging platform with AI Capabilities",
    contact: {
      email: "contact@shivam-karn.com.np",
    },
  },
  servers: [
    {
      url: "https://blogify-api.shivamkarn.workers.dev",
      description: "Production",
    },
    { url: "http://localhost:8787", description: "Local" },
  ],
});
app.get("/docs", swaggerUI({ url: "/docs/json" }));

export default app;
