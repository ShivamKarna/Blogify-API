import { notificationController } from "./notification.controllers";
import { createRoute, z, OpenAPIHono } from "@hono/zod-openapi";
import { BindingsType, Variables } from "../lib/types";
import { requireAuth } from "../middleware/auth.middleware";
import { paginationWithUnreadSchema } from "../lib/query.schema";

const notfiRouter = new OpenAPIHono<{
  Bindings: BindingsType;
  Variables: Variables;
}>();

notfiRouter.use("/*", requireAuth);

notfiRouter.openapi(
  createRoute({
    method: "get",
    path: "/",
    tags: ["Notifications"],
    summary: "Get all notifications",
    request: {
      query: paginationWithUnreadSchema,
    },
    responses: {
      200: { description: "Your notifications Fetched" },
    },
  }),
  notificationController.getAllNotifications,
);

notfiRouter.openapi(
  createRoute({
    method: "patch",
    path: "/:id/read",
    tags: ["Notifications"],
    summary: "Mark Notification as Read",
    responses: {
      404: { description: "Notification not found" },
      200: { description: "Notification marked as read" },
    },
  }),
  notificationController.markAsRead,
);

notfiRouter.openapi(
  createRoute({
    method: "patch",
    path: "/read-all",
    tags: ["Notifications"],
    summary: "Mark All Notifications as Read",
    responses: {
      200: { description: "All Notifications marked as read" },
    },
  }),
  notificationController.markAllAsRead,
);

notfiRouter.openapi(
  createRoute({
    method: "delete",
    path: "/:id",
    tags: ["Notifications"],
    summary: "Delete Notification",
    responses: {
      404: { description: "Notification not found" },
      200: { description: "Notification Deleted Successfully" },
    },
  }),
  notificationController.deleteNotification,
);

export { notfiRouter };
