// link : /api/blog
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  blogController,
  createBlogSchema,
  updateBlogSchema,
} from "../controllers/blog.controllers";
import { requireAuth, optionalAuth } from "../middleware/auth.middleware";
import { BindingsType } from "../lib/types";
import { Variables } from "../lib/types";

const publicBlogRouter = new OpenAPIHono<{
  Bindings: BindingsType;
  Variables: Variables;
}>();
const privateBlogRouter = new OpenAPIHono<{
  Bindings: BindingsType;
  Variables: Variables;
}>();

privateBlogRouter.use("*", requireAuth);
publicBlogRouter.use("*", optionalAuth);

publicBlogRouter.openapi(
  createRoute({
    method: "get",
    path: "/",
    tags: ["Blogs"],
    summary: "Get all blogs",
    request: {
      query: z.object({
        page: z.string().optional(),
        limit: z.string().optional(),
      }),
    },
    responses: {
      200: { description: "Blogs fetched successfully" },
    },
  }),
  blogController.getBlogs,
);

publicBlogRouter.openapi(
  createRoute({
    method: "get",
    path: "/search",
    tags: ["Blogs"],
    summary: "Search blogs by title",
    request: {
      query: z.object({
        q: z.string(),
        page: z.string().optional(),
        limit: z.string().optional(),
      }),
    },
    responses: {
      400: { description: "Query required" },
      200: { description: "Blogs fetched successfully" },
    },
  }),
  blogController.searchBlogs,
);

publicBlogRouter.openapi(
  createRoute({
    method: "get",
    path: "/:slug",
    tags: ["Blogs"],
    summary: "Get blog by slug",
    responses: {
      404: { description: "Not found" },
      200: { description: "Blog fetched successfully" },
    },
  }),
  blogController.getBlogBySlug,
);
publicBlogRouter.openapi(
  createRoute({
    method: "get",
    path: "/me",
    tags: ["Blogs"],
    summary: "Get my blogs",
    request: {
      query: z.object({
        page: z.string().optional(),
        limit: z.string().optional(),
      }),
    },
    responses: {
      200: { description: "Blogs fetched successfully" },
    },
  }),
  blogController.getMyBlogs,
);

privateBlogRouter.openapi(
  createRoute({
    method: "post",
    path: "/",
    tags: ["Blogs"],
    summary: "Create a Blog Post",
    request: {
      body: {
        content: {
          "application/json": {
            schema: createBlogSchema,
          },
        },
      },
    },
    responses: {
      400: { description: "Parsing Error" },
      500: { description: "Internal Server Error" },
      201: { description: "Blog created Successfully" },
    },
  }),
  blogController.createBlog,
);

privateBlogRouter.openapi(
  createRoute({
    method: "patch",
    path: "/:id",
    tags: ["Blogs"],
    summary: "Update a Blog Post",
    request: {
      body: {
        content: {
          "application/json": {
            schema: updateBlogSchema,
          },
        },
      },
    },
    responses: {
      400: { description: "Parsing Error" },
      403: { description: "Forbidden Request" },
      404: { description: "Not Found" },
      500: { description: "Internal Server Error" },
      200: { description: "Blog updated Successfully" },
    },
  }),
  blogController.updateBlog,
);

privateBlogRouter.openapi(
  createRoute({
    method: "delete",
    path: "/:id",
    tags: ["Blogs"],
    summary: "Delete a Blog",
    responses: {
      404: { description: "Not Found" },
      200: { description: "Blog Deleted Successfully" },
    },
  }),
  blogController.deleteBlog,
);

export { publicBlogRouter, privateBlogRouter };
