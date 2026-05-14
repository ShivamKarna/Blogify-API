import { notifications } from "../db/schema";
import { drizzle } from "drizzle-orm/d1";

type NotifType =
  | "reaction"
  | "comment"
  | "comment_reply"
  | "comment_like"
  | "follow"
  | "mention"
  | "new_blog";

type ParamsType = {
  recipientId: string;
  actorId: string;
  type: NotifType;
  entityId: string;
  entityType: string;
};
const createNotification = async (
  db: D1Database,
  { recipientId, actorId, type, entityId, entityType }: ParamsType,
) => {
  if (recipientId === actorId) return;
  const drizzleDb = drizzle(db);

  await drizzleDb.insert(notifications).values({
    recipientId,
    actorId,
    type,
    entityId,
    entityType,
    read: false,
  });
};

export { createNotification };
