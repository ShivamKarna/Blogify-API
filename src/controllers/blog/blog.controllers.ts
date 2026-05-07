// TODO: tags should have a seperate table i guess
import { blogs } from "../../db/schema";
import { factory } from "../../lib/factory";
import { getDb } from "../../db";
import { sql, and, desc, eq, like } from "drizzle-orm";
import { z } from "zod";

const createBlogSchema = z.object({
  title: z.string().min(2),
  subTitle: z.string().optional(),
  excerpt: z.string().optional(),
  tags: z.array(z.string()),
  content: z.string().min(2),
  coverImage: z.string().optional(), // cloudianry url
  published: z.boolean(),
  aiGenerated: z.boolean(),
});

const updateBlogSchema = createBlogSchema.partial();

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
  // list published blogs
  getBlogs = factory.createHandlers(async (c) => {
    const db = getDb(c.env.DB);
    const user = c.get("user");
    const { limit = "20", page = "1" } = c.req.query();
    const limitNum = Math.min(50, Number(limit));
    const pageNum = Math.max(1, Number(page));
    const offset = (pageNum - 1) * limitNum;

    // const result = await db
    //   .select()
    //   .from(blogs)
    //   .where(eq(blogs.published, true))
    //   .orderBy(desc(blogs.createdAt))
    //   .limit(limitNum)
    //   .offset(offset);

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
      limit: limitNum,
      orderBy: (blogs, { desc }) => [desc(blogs.createdAt)],
      offset,
    });

    return c.json({ blogs: result, page: pageNum, limit: limitNum }, 200);
  });

  getBlogBySlug = factory.createHandlers(async (c) => {
    const db = getDb(c.env.DB);
    const slug = c.req.param("slug");

    if (!slug) {
      return c.json({ error: "Blog not found" }, 404);
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
      return c.json({ error: "Blog not found" }, 404);
    }

    await db
      .update(blogs)
      .set({ viewCount: sql`${blogs.viewCount} + 1` })
      .where(eq(blogs.id, result.id));

    return c.json({ data: result }, 200);
  });

  getMyBlogs = factory.createHandlers(async (c) => {
    const db = getDb(c.env.DB);
    const user = c.get("user");

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
    });

    return c.json({ blogs: result }, 200);
  });

  searchBlogs = factory.createHandlers(async (c) => {
    const db = getDb(c.env.DB);
    const { q } = c.req.query();

    if (!q) {
      return c.json({ error: "Query required" }, 404);
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
      limit: 20,
    });

    return c.json({ blogs: result }, 200);
  });

  createBlog = factory.createHandlers(async (c) => {
    const db = getDb(c.env.DB);
    const user = c.get("user");

    const userInput = await c.req.json();

    const parsed = createBlogSchema.safeParse(userInput);

    if (!parsed.success) {
      return c.json({ error: parsed.error.issues }, 400);
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
      return c.json({ message: "Internal server error" }, 500);
    }
    return c.json({ data: result, message: "Blog created Successfully" }, 201);
  });

  updateBlog = factory.createHandlers(async (c) => {
    const db = getDb(c.env.DB);
    const user = c.get("user");
    const id = c.req.param("id");

    if (!id) {
      return c.json({ error: "Blog Not Found" }, 404);
    }

    const userInput = await c.req.json();

    const parsed = updateBlogSchema.safeParse(userInput);

    if (!parsed.success) {
      return c.json({ error: parsed.error.issues }, 400);
    }

    const existing = await db.query.blogs.findFirst({
      where: eq(blogs.id, id),
      columns: { id: true, authorId: true },
    });

    if (!existing) {
      return c.json({ error: "Blog Not found" }, 404);
    }
    if (existing.authorId !== user.id) {
      return c.json({ error: "Forbidden" }, 403);
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

    return c.json(
      { data: result[0], message: "Blog updated Successfully" },
      200,
    );
  });
  deleteBlog = factory.createHandlers(async (c) => {
    const db = getDb(c.env.DB);
    const user = c.get("user");
    const id = c.req.param("id");

    if (!id) {
      return c.json({ error: "Blog Not Found" }, 404);
    }

    const existing = await db.query.blogs.findFirst({
      where: eq(blogs.id, id),
      columns: {
        id: true,
        authorId: true,
      },
    });

    if (!existing) {
      return c.json({ error: "Not found" }, 404);
    }
    if (existing.authorId !== user.id) {
      return c.json({ error: "Forbidden" }, 403);
    }

    await db.delete(blogs).where(eq(blogs.id, id));
    return c.json({ message: "Blog deleted successfully" }, 200);
  });
}

export const blogController = new BlogController();
