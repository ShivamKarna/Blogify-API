export type NotificationPayload = {
  recipientId: string;
  actorId: string;
  type:
    | "reaction"
    | "follow"
    | "comment"
    | "comment_reply"
    | "comment_like"
    | "new_blog"
    | "mention";
  entityId: string;
  entityType: "blog" | "comment" | "follow";
};

async function sendNotification(queue: Queue, payload: NotificationPayload) {
  if (payload.recipientId === payload.actorId) return;
  await queue.send(payload);
}
async function sendNotificationBatch(
  queue: Queue,
  payloads: NotificationPayload[],
  actorId: string,
) {
  const filtered = payloads.filter((p) => p.recipientId !== p.actorId);
  if (filtered.length === 0) return;

  await queue.sendBatch(filtered.map((payload) => ({ body: payload })));
}

export { sendNotification, sendNotificationBatch };
