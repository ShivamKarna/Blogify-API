// api link : /api/upload

import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { BindingsType, Variables } from "../lib/types";
import { requireAuth } from "../middleware/auth.middleware";
import { cloudinaryController } from "./cloudinary.controllers";

const cloudinaryRouter = new OpenAPIHono<{
  Bindings: BindingsType;
  Variables: Variables;
}>();

cloudinaryRouter.use("/*", requireAuth);

cloudinaryRouter.openapi(
  createRoute({
    method: "post",
    path: "/",
    tags: ["Upload"],
    summary: "Upload an image or PDF to Cloudinary",
    responses: {
      400: { description: "No file provided or invalid file type" },
      200: { description: "File uploaded successfully" },
    },
  }),
  cloudinaryController.uploadImage,
);

export { cloudinaryRouter };
