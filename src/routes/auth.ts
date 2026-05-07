import { Hono } from "hono";
import { getBetterAuthInstance } from "../lib/auth";
import type { BindingsType } from "../lib/types";

const authRouter = new Hono<{ Bindings: BindingsType }>();

authRouter.on(["GET", "POST"], "/**", async (c) => {
  const authInstance = getBetterAuthInstance(c.env.DB, c.env);
  return authInstance.handler(c.req.raw);
});

export default authRouter;
