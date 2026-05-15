// api link : /api/ai
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { BindingsType, Variables } from "../lib/types";
import { requireAuth } from "../middleware/auth.middleware";
import { geminiController } from "./gemini.controllers";
import {
  generateExcerptSchema,
  generatePostSchema,
  generateTitlesSchema,
  improveTextSchema,
  suggestTagsSchema,
} from "./gemini.schemas";

const geminiRouter = new OpenAPIHono<{
  Bindings: BindingsType;
  Variables: Variables;
}>();

geminiRouter.use("/*", requireAuth);

geminiRouter.openapi(
  createRoute({
    method: "post",
    path: "/generate-post",
    tags: ["AI"],
    summary: "Generate a blog post from a topic",
    request: {
      body: {
        content: {
          "application/json": {
            schema: generatePostSchema,
          },
        },
      },
    },
    responses: {
      400: { description: "Validation error" },
      200: { description: "Post generated successfully" },
    },
  }),
  geminiController.generatePost,
);

geminiRouter.openapi(
  createRoute({
    method: "post",
    path: "/generate-titles",
    tags: ["AI"],
    summary: "Generate blog post titles",
    request: {
      body: {
        content: {
          "application/json": {
            schema: generateTitlesSchema,
          },
        },
      },
    },
    responses: {
      400: { description: "Validation error" },
      200: { description: "Titles generated successfully" },
    },
  }),
  geminiController.generateTitles,
);

geminiRouter.openapi(
  createRoute({
    method: "post",
    path: "/generate-excerpt",
    tags: ["AI"],
    summary: "Generate excerpt from blog content",
    request: {
      body: {
        content: {
          "application/json": {
            schema: generateExcerptSchema,
          },
        },
      },
    },
    responses: {
      400: { description: "Validation error" },
      200: { description: "Excerpt generated successfully" },
    },
  }),
  geminiController.generateExcerpt,
);

geminiRouter.openapi(
  createRoute({
    method: "post",
    path: "/suggest-tags",
    tags: ["AI"],
    summary: "Suggest tags for a blog post",
    request: {
      body: {
        content: {
          "application/json": {
            schema: suggestTagsSchema,
          },
        },
      },
    },
    responses: {
      400: { description: "Validation error" },
      200: { description: "Tags suggested successfully" },
    },
  }),
  geminiController.suggestTags,
);

geminiRouter.openapi(
  createRoute({
    method: "post",
    path: "/improve",
    tags: ["AI"],
    summary: "Improve or rewrite a piece of text",
    request: {
      body: {
        content: {
          "application/json": {
            schema: improveTextSchema,
          },
        },
      },
    },
    responses: {
      400: { description: "Validation error" },
      200: { description: "Text improved successfully" },
    },
  }),
  geminiController.improveText,
);

export { geminiRouter };
