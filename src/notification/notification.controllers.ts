import { Context } from "hono";
import { getDb } from "../db";
import { getPagination } from "../lib/helpful.functions";
import { notifications } from "../db/schema";
import { eq, and } from "drizzle-orm";

class NotificationController {
  // getAllNotifications
  // markAsRead
  // markAllAsRead
  // deleteNotification

  getAllNotifications = async (c: Context) => {
    const db = getDb(c.env.blogify_db);
    const { page, limit, offset } = getPagination(c.req.query());
    const user = c.get("user");
    const { unread } = c.req.query();

    const whereCondition =
      unread === "true"
        ? and(
            eq(notifications.recipientId, user.id),
            eq(notifications.read, false),
          )
        : eq(notifications.recipientId, user.id);

    const total = await db.$count(notifications, whereCondition);

    const result = await db.query.notifications.findMany({
      where: whereCondition,
      columns: {
        id: true,
        type: true,
        entityType: true,
        entityId: true,
        read: true,
        createdAt: true,
      },
      with: {
        actor: {
          columns: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: (notifications, { desc }) => [desc(notifications.createdAt)],
      limit,
      offset,
    });

    return c.json(
      {
        success: true,
        message: "Your notifications fetched",
        data: result,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total,
        },
      },
      200,
    );
  };
  markAsRead = async (c: Context) => {
    const db = getDb(c.env.blogify_db);
    const user = c.get("user");
    const notificationId = c.req.param("id");

    if (!notificationId) {
      return c.json({ success: false, error: "Notification not found" }, 404);
    }

    await db
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.recipientId, user.id),
        ),
      );
    return c.json(
      {
        success: true,
        message: "Notification marked as read",
      },
      200,
    );
  };
  markAllAsRead = async (c: Context) => {
    const db = getDb(c.env.blogify_db);
    const user = c.get("user");

    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.recipientId, user.id));
    return c.json(
      {
        success: true,
        message: "All Notifications marked as read",
      },
      200,
    );
  };
  deleteNotification = async (c: Context) => {
    const db = getDb(c.env.blogify_db);
    const user = c.get("user");

    const notificationId = c.req.param("id");

    if (!notificationId) {
      return c.json({ success: false, error: "Notification not found" }, 404);
    }

    await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.recipientId, user.id),
        ),
      );
    return c.json(
      {
        success: true,
        message: "Notification Deleted Successfully",
      },
      200,
    );
  };
}

export const notificationController = new NotificationController();
