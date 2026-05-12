// api link : /api/users/

import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { BindingsType, Variables } from "../lib/types";
import { requireAuth } from "../middleware/auth.middleware";
import { followsController } from "../controllers/follow.controllers";

const userRouter = new OpenAPIHono<{
  Bindings: BindingsType;
  Variables: Variables;
}>();

userRouter.use("/*", requireAuth);

userRouter.openapi(
  createRoute({
    method: "post",
    path: "/:id/follow",
    tags: ["User"],
    summary: "Follow a User",
    responses: {
      404: { description: "User not found" },
      400: { description: "Cannot follwo yourself" },
      200: { description: "User followed successfully" },
    },
  }),
  followsController.followUser,
);

userRouter.openapi(
  createRoute({
    method: "delete",
    path: "/:id/follow",
    tags: ["User"],
    summary: "UnFollow a User",
    responses: {
      404: { description: "User not found" },
      400: { description: "Cannot Unfollwo yourself" },
      200: { description: "User Unfollowed successfully" },
    },
  }),
  followsController.unFollowUser,
);

userRouter.openapi(
  createRoute({
    method: "get",
    path: "/:id/followers",
    tags: ["User"],
    summary: "Get followers list of a User",
    responses: {
      404: { description: "User not found" },
      403: { description: "Private Account" },
      200: { description: "Followers list fetched successfully" },
    },
  }),
  followsController.getFollowers,
);

userRouter.openapi(
  createRoute({
    method: "get",
    path: "/:id/following",
    tags: ["User"],
    summary: "Get following list of a User",
    responses: {
      404: { description: "User not found" },
      403: { description: "Private Account" },
      200: { description: "Following List fetched successfully" },
    },
  }),
  followsController.getFollowing,
);
export { userRouter };
