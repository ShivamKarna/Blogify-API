import { OpenAPIHono } from "@hono/zod-openapi";
import { mainRouter } from "./routes";
import { swaggerUI } from "@hono/swagger-ui";
import type { MessageBatch } from "@cloudflare/workers-types";
import type { BindingsType } from "./lib/types";
import { createNotification } from "./lib/notification.helper";
import type { NotificationPayload } from "./lib/notificationQueue";

const app = new OpenAPIHono();

app.get("/", (c) => {
  return c.json({
    name: "Blogify API",
    status: "healthy",
    description: "AI-powered blogging platform API",
    docs: "/docs",
    health: "/health",
    api: "/api",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
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

const worker = {
  fetch: app.fetch,
  queue: async (
    batch: MessageBatch<NotificationPayload>,
    env: BindingsType,
  ) => {
    const tasks = batch.messages.map(async (message) => {
      const payload = message.body;
      try {
        await createNotification(env.blogify_db, {
          recipientId: payload.recepientId,
          actorId: payload.actorId,
          type: payload.type,
          entityId: payload.entityId,
          entityType: payload.entityType,
        });
        message.ack();
      } catch (error) {
        console.log("Failed to proces notification : ", error);
        message.retry();
      }
    });

    await Promise.all(tasks);
  },
};

export default worker;
