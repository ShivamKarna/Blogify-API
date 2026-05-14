type NotificationPayload = {
  recepientId: string;
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
  if (payload.recepientId === payload.actorId) {
    return;
  }
  await queue.send(payload);
}

export { sendNotification };
