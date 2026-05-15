import { Context } from "hono";
import { blogs, commentLikes, comments } from "../db/schema";
import { getDb } from "../db";
import { and, eq, sql, isNull } from "drizzle-orm";
import { getPagination } from "../lib/helpful.functions";
import { z } from "zod";
import { sendNotification } from "../lib/notificationQueue";

// getCommentsOf a Blog Post
// addComment to a Blog post = has notification / queue service
// updateComment of a BLog post
// delete comment from a blog post
// like comment = has notification / queue service
// unlike comment

class CommentsController {
  getComments = async (c: Context) => {
    const db = getDb(c.env.blogify_db);
    const blogId = c.req.param("id");
    if (!blogId) {
      return c.json({ success: false, error: "Blog not found" }, 404);
    }

    const existing = await db.query.blogs.findFirst({
      where: eq(blogs.id, blogId),
      columns: {
        id: true,
        published: true,
      },
    });
    if (!existing || existing.published !== true) {
      return c.json({ success: false, error: "Blog not found" }, 404);
    }

    const { page, limit, offset } = getPagination(c.req.query());
    const total = await db.$count(
      comments,
      and(eq(comments.blogId, blogId), isNull(comments.parentId)),
    );

    const result = await db.query.comments.findMany({
      where: eq(comments.blogId, blogId),
      columns: {
        id: true,
        authorId: true,
        content: true,
        parentId: true,
        rootId: true,
        likeCount: true,
        replyCount: true,
        edited: true,
        editedAt: true,
      },
      with: {
        author: {
          columns: { id: true, name: true, image: true },
        },
        // replies: {
        /**
         * will create another route/api for getting replies,
         * jena youtube me hoixai,
         * user will have to click on another button like "Show replies",
         * then only the seperate api will be fetched whichc will show all the replies,
         * so it is managed , not ki eketa api call me sab kixo send kadebai
         */
        //   where: eq(comments.deleted, false),
        //   columns: {
        //     id: true,
        //     authorId: true,
        //     content: true,
        //     parentId: true,
        //     likeCount: true,
        //     edited: true,
        //     editedAt: true,
        //   },
        // },
        // with: {
        //   author: {
        //     columns: { id: true, name: true, image: true },
        //   },
      },
      orderBy: (comments, { desc }) => [desc(comments.createdAt)],
      limit,
      offset,
    });

    return c.json(
      {
        success: true,
        message: "Comments fetched Successfully",
        data: result,
        meta: {
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total,
        },
      },
      200,
    );
  };
  // so e api call hetai when user clicks on Show Replies button
  getReplies = async (c: Context) => {
    const db = getDb(c.env.blogify_db);
    const commentId = c.req.param("id");
    if (!commentId) {
      return c.json({ success: false, error: "Comment not found" }, 404);
    }

    const existing = await db.query.comments.findFirst({
      where: eq(comments.id, commentId),
      columns: {
        id: true,
        authorId: true,
      },
    });
    if (!existing) {
      return c.json({ success: false, error: "Comment not found" }, 404);
    }

    const { page, limit, offset } = getPagination(c.req.query());
    const total = await db.$count(
      comments,
      and(eq(comments.parentId, commentId), eq(comments.deleted, false)),
    );
    const result = await db.query.comments.findMany({
      where: and(eq(comments.parentId, commentId), eq(comments.deleted, false)),
      columns: {
        id: true,
        authorId: true,
        content: true,
        parentId: true,
        likeCount: true,
        edited: true,
        editedAt: true,
        createdAt: true,
      },
      with: {
        author: {
          columns: { id: true, name: true, image: true },
        },
      },
      orderBy: (comments, { asc }) => [asc(comments.createdAt)],
      limit,
      offset,
    });
    return c.json(
      {
        success: true,
        message: "Replies fetched Successfully",
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

  addComment = async (c: Context) => {
    const db = getDb(c.env.blogify_db);
    const blogId = c.req.param("id");
    const user = c.get("user");

    if (!blogId) {
      return c.json({ success: false, error: "Blog not found" }, 404);
    }

    const existing = await db.query.blogs.findFirst({
      where: eq(blogs.id, blogId),
      columns: {
        id: true,
        published: true,
        authorId: true,
      },
    });

    if (!existing || existing.published !== true) {
      return c.json({ success: false, error: "Blog not found" }, 404);
    }

    const userInput = await c.req.json();
    const schema = z.object({
      content: z.string().min(2),
      parentId: z.string().optional(),
    });

    const parsed = schema.safeParse(userInput);

    if (!parsed.success) {
      return c.json({ success: false, error: parsed.error.issues }, 400);
    }

    let rootId: string | null = null;

    let parentComment:
      | {
          id: string;
          rootId: string | null;
          authorId: string;
        }
      | null
      | undefined = null;

    if (parsed.data.parentId) {
      parentComment = await db.query.comments.findFirst({
        where: eq(comments.id, parsed.data.parentId),
        columns: { id: true, rootId: true, authorId: true },
      });

      if (!parentComment) {
        return c.json(
          { success: false, error: "Parent Comment not found" },
          404,
        );
      }
      rootId = parentComment.rootId ?? parentComment.id;
    }

    const result = await db
      .insert(comments)
      .values({
        blogId,
        authorId: user.id,
        content: parsed.data.content,
        parentId: parsed.data.parentId ?? null,
        rootId,
      })
      .returning();

    // update replyCount
    if (parsed.data.parentId) {
      await db
        .update(comments)
        .set({ replyCount: sql`${comments.replyCount} + 1` })
        .where(eq(comments.id, parsed.data.parentId));
    }

    if (result.length === 0) {
      return c.json({ success: false, error: "Internal server Error" }, 500);
    }

    await sendNotification(c.env.blogify_notifications, {
      recepientId: existing.authorId,
      actorId: user.id,
      type: "comment",
      entityId: result[0].id,
      entityType: "comment",
    });

    if (!parentComment) {
      return c.json({ success: false, error: "Parent Comment not found" }, 404);
    }

    if (parsed.data.parentId) {
      await sendNotification(c.env.blogify_notifications, {
        recepientId: parentComment.authorId,
        actorId: user.id,
        type: "comment_reply",
        entityId: result[0].id,
        entityType: "comment",
      });
    }

    return c.json(
      { success: true, message: "Comment added Successfully", data: result[0] },
      201,
    );
  };

  updateComment = async (c: Context) => {
    const db = getDb(c.env.blogify_db);
    const commentId = c.req.param("id");
    const user = c.get("user");

    if (!commentId) {
      return c.json({ success: false, error: "Blog not found" }, 404);
    }

    const existing = await db.query.comments.findFirst({
      where: eq(comments.id, commentId),
      columns: {
        id: true,
        authorId: true,
        deleted: true,
      },
    });

    if (!existing) {
      return c.json({ success: false, error: "Comment not found" }, 404);
    }

    if (existing.deleted === true) {
      return c.json({ success: false, error: "Comment not found" }, 404);
    }

    if (existing.authorId !== user.id) {
      return c.json({ success: false, error: "Forbidden" }, 403);
    }

    const userInput = await c.req.json();
    const schema = z.object({
      content: z.string().min(2),
      parentId: z.string().optional(),
    });

    const parsed = schema.safeParse(userInput);

    if (!parsed.success) {
      return c.json({ success: false, error: parsed.error.issues }, 400);
    }

    const result = await db
      .update(comments)
      .set({
        content: parsed.data.content,
        edited: true,
        editedAt: new Date(),
      })
      .where(eq(comments.id, commentId))
      .returning();

    if (result.length === 0) {
      return c.json({ success: false, error: "Internal server Error" }, 500);
    }

    return c.json(
      {
        success: true,
        message: "Comment updated successfully",
        data: result[0],
      },
      200,
    );
  };

  deleteComment = async (c: Context) => {
    const db = getDb(c.env.blogify_db);
    const commentId = c.req.param("id");
    const user = c.get("user");

    if (!commentId) {
      return c.json({ success: false, error: "Comment not found" }, 404);
    }

    const existing = await db.query.comments.findFirst({
      where: eq(comments.id, commentId),
      columns: {
        id: true,
        authorId: true,
        deleted: true,
      },
    });
    if (!existing) {
      return c.json({ success: false, error: "Comment not found" }, 404);
    }

    if (existing.deleted === true) {
      return c.json({ success: false, error: "Comment not found" }, 404);
    }

    if (existing.authorId !== user.id) {
      return c.json({ success: false, error: "Forbidden" }, 403);
    }

    // soft delete for now , badme using cron jobs i'll delete those ghost comments
    await db
      .update(comments)
      .set({ deleted: true, content: "[deleted]" })
      .where(eq(comments.id, commentId));

    return c.json(
      { success: true, message: "Comment Deleted Successfully" },
      200,
    );
  };
  likeComment = async (c: Context) => {
    const db = getDb(c.env.blogify_db);
    const commentId = c.req.param("id");
    const user = c.get("user");

    if (!commentId) {
      return c.json({ success: false, error: "Comment not found" }, 404);
    }

    const existing = await db.query.comments.findFirst({
      where: eq(comments.id, commentId),
      columns: {
        id: true,
        authorId: true,
      },
    });
    if (!existing) {
      return c.json({ success: false, error: "Comment not found" }, 404);
    }

    await db.insert(commentLikes).values({ commentId, userId: user.id });

    await db
      .update(comments)
      .set({ likeCount: sql`${comments.likeCount} + 1` })
      .where(eq(comments.id, commentId));

    await sendNotification(c.env.blogify_notifications, {
      recepientId: existing.authorId,
      actorId: user.id,
      type: "comment_like",
      entityId: commentId,
      entityType: "comment",
    });

    return c.json({ success: true, message: "Comment liked" }, 200);
  };
  unlikeComment = async (c: Context) => {
    const db = getDb(c.env.blogify_db);
    const commentId = c.req.param("id");
    const user = c.get("user");

    if (!commentId) {
      return c.json({ success: false, error: "Comment not found" }, 404);
    }

    const existing = await db.query.comments.findFirst({
      where: eq(comments.id, commentId),
      columns: {
        id: true,
        deleted: true,
      },
    });
    if (!existing || existing.deleted) {
      return c.json({ success: false, error: "Comment not found" }, 404);
    }

    await db
      .delete(commentLikes)
      .where(
        and(
          eq(commentLikes.commentId, commentId),
          eq(commentLikes.userId, user.id),
        ),
      );

    await db
      .update(comments)
      .set({ likeCount: sql`MAX(0,${comments.likeCount} - 1)` })
      .where(eq(comments.id, commentId));

    return c.json({ success: true, message: "Comment Unliked" }, 200);
  };
}

export const commentsController = new CommentsController();
