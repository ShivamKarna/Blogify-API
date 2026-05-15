import { Context } from "hono";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { user, blogs, follows } from "../db/schema";

class UserController {
  getUserProfile = async (c: Context) => {
    const db = getDb(c.env.blogify_db);
    const targetUserId = c.req.param("id");

    if (!targetUserId) {
      return c.json({ success: false, error: "User not found" }, 404);
    }

    const targetUser = await db.query.user.findFirst({
      where: eq(user.id, targetUserId),
      columns: {
        id: true,
        name: true,
        image: true,
        createdAt: true,
        isPublic: true,
      },
    });

    if (!targetUser) {
      return c.json({ success: false, error: "User not found" }, 404);
    }

    const blogCount = await db.$count(blogs, eq(blogs.authorId, targetUserId));

    const followerCount = await db.$count(
      follows,
      eq(follows.followingId, targetUserId),
    );

    const followingCount = await db.$count(
      follows,
      eq(follows.followerId, targetUserId),
    );

    const recentBlogs = await db.query.blogs.findMany({
      where: eq(blogs.authorId, targetUserId),
      columns: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        createdAt: true,
      },
      orderBy: (blogs, { desc }) => [desc(blogs.createdAt)],
      limit: 5,
    });

    return c.json(
      {
        success: true,
        data: {
          user: targetUser,
          stats: {
            blogCount,
            followerCount,
            followingCount,
          },
          recentBlogs,
        },
      },
      200,
    );
  };
}

export const userController = new UserController();
