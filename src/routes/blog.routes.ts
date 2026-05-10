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
import { commentsController } from "../controllers/comment.controllers";

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
    path: "/me",
    tags: ["Blogs"],
    summary: "Get my blogs", // put /me in public routes but it is protected in controller, so it' fine
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

// blog + reactions route
publicBlogRouter.openapi(
  createRoute({
    method: "get",
    path: "/reactions/:id",
    tags: ["Blogs"],
    summary: "Get all reactions of a Blog",
    responses: {
      404: { description: "Not Found" },
      200: { description: "Reaction Fetched Successfully" },
    },
  }),
  blogController.getAllReactionsOfBlog,
);
privateBlogRouter.openapi(
  createRoute({
    method: "post",
    path: "/reactions/:id",
    tags: ["Blogs"],
    summary: "Add Reaction to a Blog",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              type: z.enum(["LIKE", "LOVE", "FIRE"]),
            }),
          },
        },
      },
    },
    responses: {
      404: { description: "Blog not found" },
      400: { description: "Invalid Reaction Type" },
      200: { description: "Reaction Added" },
    },
  }),
  blogController.addReactionToBlog,
);

privateBlogRouter.openapi(
  createRoute({
    method: "delete",
    path: "/reactions/:id",
    tags: ["Blogs"],
    summary: "Delete Reaction from a Blog",
    responses: {
      404: { description: "Not Found" },
      200: { description: "Reaction Deleted Successfully" },
    },
  }),
  blogController.deleteReactionFromBlog,
);

publicBlogRouter.openapi(
  createRoute({
    method: "get",
    path: "/:id/comments",
    tags: ["Comments"],
    summary: "Get comments of a Blog ",
    responses: {
      404: { description: "Blog not found" },
      200: { description: "Comments fetched successfully" },
    },
  }),
  commentsController.getComments,
);

publicBlogRouter.openapi(
  createRoute({
    method: "get",
    path: "/comments/:id/replies",
    tags: ["Comments"],
    summary: "Get Replies of a comment",
    responses: {
      404: { description: "Blog not found" },
      200: { description: "Comments fetched successfully" },
    },
  }),
  commentsController.getReplies,
);
privateBlogRouter.openapi(
  createRoute({
    method: "post",
    path: "/:id/comments",
    tags: ["Comments"],
    summary: "Add comment to a Blog",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              content: z.string().min(2),
              parentId: z.string().optional(),
            }),
          },
        },
      },
    },
    responses: {
      404: { description: "Blog not found / Parent Comment not found" },
      400: { description: "Invalid Input" },
      500: { description: "Internal Server Error" },
      201: { description: "Comment addedd Successfully" },
    },
  }),
  commentsController.addComment,
);
privateBlogRouter.openapi(
  createRoute({
    method: "patch",
    path: "/comments/:id",
    tags: ["Comments"],
    summary: "Update comment of a Blog",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              content: z.string().min(2),
            }),
          },
        },
      },
    },
    responses: {
      404: { description: "Blog not found / Parent Comment not found" },
      400: { description: "Invalid Input" },
      200: { description: "Comment updated Successfully" },
    },
  }),
  commentsController.updateComment,
);

privateBlogRouter.openapi(
  createRoute({
    method: "delete",
    path: "/comments/:id",
    tags: ["Comments"],
    summary: "Delete Comment of a blog",
    responses: {
      404: { description: "Comment not found" },
      403: { description: "Forbidden" },
      200: { description: "Comment delete Successfully" },
    },
  }),
  commentsController.deleteComment,
);

privateBlogRouter.openapi(
  createRoute({
    method: "post",
    path: "/comments/:id/like",
    tags: ["Comments"],
    summary: "Like a comment",
    responses: {
      404: { description: "Comment not found" },
      200: { description: "Comment Liked" },
    },
  }),
  commentsController.likeComment,
);

privateBlogRouter.openapi(
  createRoute({
    method: "delete",
    path: "/comments/:id/like",
    tags: ["Comments"],
    summary: "Unlike a comment",
    responses: {
      404: { description: "Comment not found" },
      200: { description: "Comment UnLiked" },
    },
  }),
  commentsController.unlikeComment,
);

privateBlogRouter.openapi(
  createRoute({
    method: "post",
    path: "/:id/save",
    tags: ["Blogs"],
    summary: "Save a Blog Post",
    responses: {
      404: { description: "Blog Not Found" },
      200: { description: "Blog Saved successfully" },
    },
  }),
  blogController.saveBlog,
);
privateBlogRouter.openapi(
  createRoute({
    method: "delete",
    path: "/:id/save",
    tags: ["Blogs"],
    summary: "Unsave a Blog Post",
    responses: {
      404: { description: "Blog Not Found / Post Not Saved" },
      200: { description: "Blog UnSaved successfully" },
    },
  }),
  blogController.unSaveBlog,
);

privateBlogRouter.openapi(
  createRoute({
    method: "get",
    path: "/me/saved-blogs",
    tags: ["Blogs"],
    summary: "Get my Saved Blogs",
    responses: {
      404: { description: "Blog Not Found" },
      200: { description: "Blog fetched successfully" },
    },
  }),
  blogController.getAllSavedBlogs,
);
// moved slug to last so it doesn't conflict with other routes
publicBlogRouter.openapi(
  createRoute({
    method: "get",
    path: "/:slug",
    tags: ["Blogs"],
    summary: "Get blog by slug",
    responses: {
      404: { description: "Blog Not Found" },
      200: { description: "Blog fetched successfully" },
    },
  }),
  blogController.getBlogBySlug,
);

export { publicBlogRouter, privateBlogRouter };
