import { Scalar } from "@scalar/hono-api-reference";
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { MessageBatch } from "@cloudflare/workers-types";
import type { BindingsType, Variables } from "./lib/types";
import type { NotificationPayload } from "./notification/notificationQueue";
import { createNotification } from "./notification/notification.helper";
import { getBetterAuthInstance } from "./lib/auth";
import { rateLimiter } from "./middleware/rateLimiter.middleware";
import { publicBlogRouter, privateBlogRouter } from "./blog/blog.routes";
import { userRouter } from "./user/user.routes";
import { notfiRouter } from "./notification/notification.routes";
import { geminiRouter } from "./ai/gemini.routes";
import { cloudinaryRouter } from "./cloudinary/cloudinary.routes";
import { apiReference } from "@scalar/hono-api-reference";

const app = new OpenAPIHono<{ Bindings: BindingsType; Variables: Variables }>();

app.use("/*", logger());

app.use("/*", async (c, next) => {
  return cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://blogify-api.shivamkarn.workers.dev",
    ],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })(c, next);
});

app.use("/api/*", rateLimiter);

app.get("/", (c) =>
  c.json({
    service: "blogify-api",
    version: "1.0.0",
    status: "ok",
  }),
);

app.get("/health", (c) =>
  c.json({ status: "ok", timestamp: new Date().toISOString() }),
);

app.on(["GET", "POST"], "/api/auth/**", async (c) => {
  const auth = getBetterAuthInstance(c.env.blogify_db, c.env);
  return auth.handler(c.req.raw);
});

app.route("/api/blog", publicBlogRouter);
app.route("/api/blog", privateBlogRouter);
app.route("/api/users", userRouter);
app.route("/api/notifications", notfiRouter);
app.route("/api/ai", geminiRouter);
app.route("/api/upload", cloudinaryRouter);

app.doc("/docs/json", {
  openapi: "3.0.0",
  info: {
    title: "Blogify API",
    version: "1.0",
    description: "Blogging platform with AI Capabilities",
    contact: { email: "contact@shivam-karn.com.np" },
  },
  servers: [
    {
      url: "https://blogify-api.shivamkarn.workers.dev",
      description: "Production",
    },
    { url: "http://localhost:8787", description: "Local" },
  ],
});

// app.get("/docs", swaggerUI({ url: "/docs/json" }));
app.get(
  "/reference",
  Scalar({
    url: "/docs/json",
    theme: "mars",
    // alternate
    // default
    // moon
    // purple
    // solarized
    // kepler
    // mars
    // saturn
  }),
);

app.onError((err, c) => {
  console.error(`[ERROR] ${err.message}`);
  return c.json(
    { success: false, error: err.message ?? "Internal Server Error" },
    500,
  );
});

app.notFound((c) => c.json({ success: false, error: "Route not found" }, 404));

export default {
  fetch: app.fetch,

  async queue(batch: MessageBatch<NotificationPayload>, env: BindingsType) {
    await Promise.all(
      batch.messages.map(async (message) => {
        try {
          await createNotification(env.blogify_db, {
            recipientId: message.body.recipientId,
            actorId: message.body.actorId,
            type: message.body.type,
            entityId: message.body.entityId,
            entityType: message.body.entityType,
          });
          message.ack();
        } catch (error) {
          console.error("Failed to process notification:", error);
          message.retry();
        }
      }),
    );
  },
};
