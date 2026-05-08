// link : /api/blog
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { blogController } from "../controllers/blog.controllers";
import { requireAuth, optionalAuth } from "../middleware/auth.middleware";
import { BindingsType } from "../lib/types";
import { Variables } from "hono/types";

const blogRouter = new OpenAPIHono<{
  Bindings: BindingsType;
  Variables: Variables;
}>();

blogRouter.openapi(
  createRoute({
    method: "get",
    path: "/",
    tags: ["Blogs"],
    summary: "Get all blogs",
    responses: {
      200: { description: "List of all Blogs which are published" },
    },
  }),
  blogController.getBlogs,
);

export { blogRouter };
