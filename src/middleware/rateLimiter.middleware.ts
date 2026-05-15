import { createMiddleware } from "hono/factory";
import { BindingsType } from "../lib/types";

const LIMIT = 30;
const WINDOW = 60;

type rateLimitBindingsType = Pick<BindingsType, "blogify_kv">;

export const rateLimiter = createMiddleware<{
  Bindings: rateLimitBindingsType;
}>(async (c, next) => {
  const ip = c.req.header("cf-connecting-ip") ?? "unknown";

  const key = `rateLimit:${ip}`;

  const current = await c.env.blogify_kv.get(key);
  const count = current ? parseInt(current, 10) : 0;

  if (count >= LIMIT) {
    return c.json({ message: "Too many requests" }, 429);
  }

  await c.env.blogify_kv.put(key, String(count + 1), {
    expirationTtl: WINDOW,
  });

  await next();
});
