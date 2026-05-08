import { createMiddleware } from "hono/factory";
import { BindingsType, Variables } from "../lib/types";
import { getBetterAuthInstance } from "../lib/auth";

export const requireAuth = createMiddleware<{
  Bindings: BindingsType;
  Variables: Variables;
}>(async (c, next) => {
  const auth = getBetterAuthInstance(c.env.blogify_db, c.env);

  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session?.user) {
    return c.json({ error: "Sign In Required", code: "UNAUTHORIZED" }, 401);
  }

  c.set("user", session.user as Variables["user"]);
  c.set("session", session.session as Variables["session"]);

  await next();
});

export const optionalAuth = createMiddleware<{
  Bindings: BindingsType;
  Variables: Variables;
}>(async (c, next) => {
  const auth = getBetterAuthInstance(c.env.blogify_db, c.env);

  try {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (session?.user) {
      c.set("user", session.user as Variables["user"]);
      c.set("session", session.session as Variables["session"]);
    }
  } catch (error) {
    // do nothing , it will be a guest session
  }

  await next();
});
