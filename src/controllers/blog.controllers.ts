/* 
  getBlogs  
  getBlogBySlug
  getMyBlogs
  searchBlogs
  createBlog = has notification / queue service
  updateBlog = has notification / queue service
  deleteBlog
  addReactionToBlog = has notification / queue service
  deleteReactionFromBlog
  getAllReactionsOfBlog
  saveBlog
  unsaveBlog
  getAllSavedBlogs
   
*/
import { blogs, follows, reactions, savedPosts, shares } from "../db/schema";
import { getDb } from "../db";
import { sql, and, eq, like } from "drizzle-orm";
import { z } from "zod";
import { Context } from "hono";
import {
  NotificationPayload,
  sendNotification,
  sendNotificationBatch,
} from "../lib/notificationQueue";
import { getPagination } from "../lib/helpful.functions";

export const createBlogSchema = z.object({
  title: z.string().min(2),
  subTitle: z.string().optional(),
  excerpt: z.string().optional(),
  tags: z.array(z.string()),
  content: z.string().min(2),
  coverImage: z.string().optional(), // cloudianry url
  published: z.boolean(),
  aiGenerated: z.boolean(),
});

export const updateBlogSchema = createBlogSchema.partial();

function slugify(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
    "-" +
    Math.random().toString(36).slice(2, 6)
  );
}

class BlogController {
  getBlogs = async (c: Context) => {
    const db = getDb(c.env.blogify_db);
    const { page, limit, offset } = getPagination(c.req.query());

    // const result = await db
    //   .select()
    //   .from(blogs)
    //   .where(eq(blogs.published, true))
    //   .orderBy(desc(blogs.createdAt))
    //   .limit(limitNum)
    //   .offset(offset);

    const total = await db.$count(blogs, eq(blogs.published, true));

    const result = await db.query.blogs.findMany({
      where: eq(blogs.published, true),
      columns: {
        id: true,
        title: true,
        excerpt: true,
        slug: true,
        tags: true,
        coverImage: true,
        viewCount: true,
        shareCount: true,
        aiGenerated: true,
        createdAt: true,
      },
      with: {
        author: {
          columns: { id: true, name: true, image: true },
        },
      },
      limit,
      orderBy: (blogs, { desc }) => [desc(blogs.createdAt)],
      offset,
    });
    if (!result) {
      return c.json({ success: false, error: "NOT_FOUND" }, 404);
    }

    return c.json(
      {
        success: true,
        message: "Blogs fetched successfully",
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

  getBlogBySlug = async (c: Context) => {
    const db = getDb(c.env.blogify_db);
    const slug = c.req.param("slug");

    if (!slug) {
      return c.json({ success: false, error: "NOT_FOUND" }, 404);
    }

    const result = await db.query.blogs.findFirst({
      where: and(eq(blogs.published, true), eq(blogs.slug, slug)),
      with: {
        author: {
          columns: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    if (!result) {
      return c.json({ success: false, error: "NOT_FOUND" }, 404);
    }

    await db
      .update(blogs)
      .set({ viewCount: sql`${blogs.viewCount} + 1` })
      .where(eq(blogs.id, result.id));

    return c.json(
      { success: true, message: "Blog fetched successfully", data: result },
      200,
    );
  };

  getMyBlogs = async (c: Context) => {
    const db = getDb(c.env.blogify_db);
    const user = c.get("user");
    const { page, limit, offset } = getPagination(c.req.query());
    if (!user) {
      return c.json({ success: false, error: "Unauthorized" }, 401);
    }

    const total = await db.$count(blogs, eq(blogs.authorId, user.id));

    const result = await db.query.blogs.findMany({
      where: eq(blogs.authorId, user.id),
      columns: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        tags: true,
        published: true,
        viewCount: true,
        shareCount: true,
        createdAt: true,
      },
      orderBy: (blogs, { desc }) => [desc(blogs.createdAt)],
      limit,
      offset,
    });

    return c.json(
      {
        success: true,
        message: "Blogs fetched successfully",
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

  searchBlogs = async (c: Context) => {
    const db = getDb(c.env.blogify_db);
    const { q } = c.req.query();
    const { page, limit, offset } = getPagination(c.req.query());

    const total = await db.$count(
      blogs,
      and(like(blogs.title, `%${q}%`), eq(blogs.published, true)),
    );

    if (!q) {
      return c.json({ success: false, error: "QUERY_REQUIRED" }, 404);
    }

    // const result = await db
    //   .select()
    //   .from(blogs)
    //   .where(and(eq(blogs.published, true), like(blogs.title, `%${title}%`)))
    //   .orderBy(desc(blogs.createdAt))
    //   .limit(20);

    const result = await db.query.blogs.findMany({
      where: and(eq(blogs.published, true), like(blogs.title, `%${q}%`)),
      columns: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        tags: true,
        createdAt: true,
      },
      orderBy: (blogs, { desc }) => [desc(blogs.createdAt)],
      with: {
        author: {
          columns: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      limit,
      offset,
    });
    if (!result) {
      return c.json({ success: false, error: "NOT_FOUND" }, 404);
    }

    return c.json(
      {
        success: true,
        message: "Blogs fetched successfully",
        data: result,
        meta: {
          query: q,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total,
        },
      },
      200,
    );
  };

  createBlog = async (c: Context) => {
    const db = getDb(c.env.blogify_db);
    const user = c.get("user");

    const userInput = await c.req.json();

    const parsed = createBlogSchema.safeParse(userInput);

    if (!parsed.success) {
      return c.json({ success: false, error: parsed.error.issues }, 400);
    }

    const slug = slugify(parsed.data.title);
    const { tags, ...rest } = parsed.data;
    const result = await db
      .insert(blogs)
      .values({
        authorId: user.id,
        slug,
        ...rest,
        tags: JSON.stringify(tags),
      })
      .returning();

    if (result.length === 0) {
      return c.json({ success: false, error: "INTERNAL_SERVER_ERROR" }, 500);
    }

    if (parsed.data.published === true) {
      const userFollowers = await db
        .select({ followerId: follows.followerId })
        .from(follows)
        .where(eq(follows.followingId, user.id));

      const BATCH_SIZE = 100;
      const batches: Promise<void>[] = [];

      for (let i = 0; i < userFollowers.length; i += BATCH_SIZE) {
        const chunk = userFollowers.slice(i, i + BATCH_SIZE);

        const payloads: NotificationPayload[] = chunk.map((item) => ({
          recepientId: item.followerId,
          actorId: user.id,
          type: "new_blog",
          entityId: result[0].id,
          entityType: "blog",
        }));
        batches.push(
          sendNotificationBatch(c.env.blogify_notifications, payloads, user.id),
        );
      }
      await Promise.all(batches);
    }

    return c.json(
      {
        success: true,
        message: "Blog created successfully",
        data: result,
      },
      201,
    );
  };

  updateBlog = async (c: Context) => {
    const db = getDb(c.env.blogify_db);
    const user = c.get("user");
    const id = c.req.param("id");

    if (!id) {
      return c.json({ success: false, error: "NOT_FOUND" }, 404);
    }

    const userInput = await c.req.json();

    const parsed = updateBlogSchema.safeParse(userInput);

    if (!parsed.success) {
      return c.json({ success: false, error: parsed.error.issues }, 400);
    }

    const existing = await db.query.blogs.findFirst({
      where: eq(blogs.id, id),
      columns: { id: true, authorId: true, published: true },
    });

    if (!existing) {
      return c.json({ success: false, error: "NOT_FOUND" }, 404);
    }
    if (existing.authorId !== user.id) {
      return c.json({ success: false, error: "Forbidden" }, 403);
    }

    const { tags, ...rest } = parsed.data;
    const updateData: Partial<typeof blogs.$inferInsert> & { updatedAt: Date } =
      {
        ...rest,
        updatedAt: new Date(),
      };

    if (typeof tags !== "undefined") {
      updateData.tags = JSON.stringify(tags);
    }

    const result = await db
      .update(blogs)
      .set(updateData)
      .where(eq(blogs.id, id))
      .returning();

    if (!result) {
      return c.json({ success: false, error: "INTERNAL_SERVER_ERROR" }, 500);
    }

    const wasAlreadyPublished = existing.published === true;
    const isNowPublished = result[0].published === true;

    if (!wasAlreadyPublished && isNowPublished) {
      const userFollowers = await db
        .select({ followerId: follows.followerId })
        .from(follows)
        .where(eq(follows.followingId, user.id));

      const BATCH_SIZE = 100;
      const batches: Promise<void>[] = [];

      for (let i = 0; i < userFollowers.length; i += BATCH_SIZE) {
        const chunk = userFollowers.slice(i, i + BATCH_SIZE);

        const payloads: NotificationPayload[] = chunk.map((item) => ({
          recepientId: item.followerId,
          actorId: user.id,
          type: "new_blog",
          entityId: result[0].id,
          entityType: "blog",
        }));

        batches.push(
          sendNotificationBatch(c.env.blogify_notifications, payloads, user.id),
        );
      }

      await Promise.all(batches);
    }

    return c.json(
      {
        success: true,
        message: "Blog updated successfully",
        data: result,
      },
      200,
    );
  };

  deleteBlog = async (c: Context) => {
    const db = getDb(c.env.blogify_db);
    const user = c.get("user");
    const id = c.req.param("id");

    if (!id) {
      return c.json({ success: false, error: "NOT_FOUND" }, 404);
    }

    const existing = await db.query.blogs.findFirst({
      where: eq(blogs.id, id),
      columns: {
        id: true,
        authorId: true,
      },
    });

    if (!existing) {
      return c.json({ success: false, error: "NOT_FOUND" }, 404);
    }
    if (existing.authorId !== user.id) {
      return c.json({ success: false, error: "Forbidden" }, 403);
    }

    await db.delete(blogs).where(eq(blogs.id, id));
    return c.json(
      { success: true, message: "Blog deleted successfully", data: null },
      200,
    );
  };
  // implementing reaction actions
  addReactionToBlog = async (c: Context) => {
    const db = getDb(c.env.blogify_db);
    const user = c.get("user");
    const blogId = c.req.param("id");

    if (!blogId) {
      return c.json({ success: false, error: "Blog not found" }, 404);
    }

    const userInput = await c.req.json();

    const validTypes = ["LIKE", "LOVE", "FIRE"];
    if (!validTypes.includes(userInput.type)) {
      return c.json({ success: false, error: "Invalid reaction type" }, 400);
    }

    const existing = await db.query.blogs.findFirst({
      where: eq(blogs.id, blogId),
      columns: {
        id: true,
        authorId: true,
        published: true,
      },
    });

    if (!existing || existing.published !== true) {
      return c.json({ success: false, error: "Blog not found" }, 404);
    }

    // upsert
    await db
      .insert(reactions)
      .values({ blogId, userId: user.id, type: userInput.type })
      .onConflictDoUpdate({
        target: [reactions.blogId, reactions.userId],
        set: { type: userInput.type },
      });

    await sendNotification(c.env.blogify_notifications, {
      recepientId: existing.authorId,
      actorId: user.id,
      type: "reaction",
      entityId: blogId,
      entityType: "blog",
    });

    return c.json({ success: true, message: "Reaction added" }, 200);
  };
  deleteReactionFromBlog = async (c: Context) => {
    const db = getDb(c.env.blogify_db);
    const blogId = c.req.param("id");
    if (!blogId) {
      return c.json({ success: false, error: "Blog not found" }, 404);
    }
    const user = c.get("user");

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

    await db
      .delete(reactions)
      .where(and(eq(reactions.blogId, blogId), eq(reactions.userId, user.id)));

    return c.json({
      success: true,
      message: "Reaction Deleted successfully",
    });
  };

  getAllReactionsOfBlog = async (c: Context) => {
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

    const result = await db.query.reactions.findMany({
      where: eq(reactions.blogId, blogId),
      columns: {
        userId: true,
        type: true,
      },
    });

    const count = result.reduce(
      (acc, r) => {
        acc[r.type] = (acc[r.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return c.json(
      {
        success: true,
        data: {
          total: result.length,
          count,
        },
      },
      200,
    );
  };
  // implementing savePosts actions
  saveBlog = async (c: Context) => {
    const db = getDb(c.env.blogify_db);
    const blogId = c.req.param("id");
    const user = c.get("user");
    if (!blogId) {
      return c.json({ success: false, error: "Blog not found" }, 404);
    }

    const existing = await db.query.blogs.findFirst({
      where: and(eq(blogs.id, blogId), eq(blogs.published, true)),
      columns: {
        id: true,
      },
    });

    if (!existing) {
      return c.json({ success: false, error: "Blog not found" }, 404);
    }

    // now save it
    const result = await db
      .insert(savedPosts)
      .values({
        userId: user.id,
        blogId,
      })
      .returning();

    return c.json(
      { success: true, message: "Blog Saved Successfully", data: result[0] },
      200,
    );
  };
  unSaveBlog = async (c: Context) => {
    const db = getDb(c.env.blogify_db);
    const blogId = c.req.param("id");
    const user = c.get("user");
    if (!blogId) {
      return c.json({ success: false, error: "Blog not found" }, 404);
    }

    const alreadySaved = await db.query.savedPosts.findFirst({
      where: and(eq(savedPosts.blogId, blogId), eq(savedPosts.userId, user.id)),
    });

    if (!alreadySaved) {
      return c.json({ success: false, error: "Post not saved" }, 400);
    }

    // now unsave it
    await db
      .delete(savedPosts)
      .where(
        and(eq(savedPosts.blogId, blogId), eq(savedPosts.userId, user.id)),
      );

    return c.json({ success: true, message: "Blog UnSaved Successfully" }, 200);
  };

  getAllSavedBlogs = async (c: Context) => {
    const db = getDb(c.env.blogify_db);
    const user = c.get("user");

    const { page, limit, offset } = getPagination(c.req.query());

    const total = await db.$count(savedPosts, eq(savedPosts.userId, user.id));

    const result = await db.query.savedPosts.findMany({
      where: eq(savedPosts.userId, user.id),
      columns: { createdAt: true },
      with: {
        blog: {
          where: eq(blogs.published, true),
          columns: {
            id: true,
            title: true,
            excerpt: true,
            slug: true,
            tags: true,
            coverImage: true,
            createdAt: true,
          },
          with: {
            author: {
              columns: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: (savedPosts, { desc }) => [desc(savedPosts.createdAt)],
      limit,
      offset,
    });

    return c.json({
      success: true,
      message: "Saved Blogs fetched Successfully",
      data: result.map((item) => ({
        savedAt: item.createdAt,
        blog: {
          ...item.blog,
        },
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  };

  // implementing shares tracking
  shareBlog = async (c: Context) => {
    const db = getDb(c.env.blogify_db);
    const blogId = c.req.param("id");
    if (!blogId) {
      return c.json({ success: false, error: "Blog not found" }, 404);
    }
    const user = c.get("user");

    const userInput = await c.req.json();

    const schema = z.object({
      platform: z.string(),
    });

    const parsed = schema.safeParse(userInput);

    if (!parsed.success) {
      return c.json({ success: false, error: parsed.error.issues }, 400);
    }

    const result = await db
      .insert(shares)
      .values({
        blogId,
        userId: user?.id ?? null,
        platform: parsed.data.platform,
      })
      .returning();

    await db
      .update(blogs)
      .set({ shareCount: sql`${blogs.shareCount} + 1` })
      .where(eq(blogs.id, blogId));

    return c.json({ success: true, message: "Blog Shared Successfully" }, 200);
  };
}

export const blogController = new BlogController();
