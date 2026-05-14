import { Context } from "hono";
import { follows, user } from "../db/schema";
import { getDb } from "../db";
import { eq, and } from "drizzle-orm";
import { getPagination } from "./blog.controllers";
import { sendNotification } from "../lib/notificationQueue";

// followUser = has notification / queue service
// unFollowUser
// getFollowers
// getFOllowing
class FollowsController {
  followUser = async (c: Context) => {
    const db = getDb(c.env.blogify_db);
    const follower = c.get("user");

    const followingId = c.req.param("id");

    if (!followingId) {
      return c.json({ success: false, error: "User not found" }, 404);
    }

    if (follower.id === followingId) {
      return c.json({ success: false, error: "Cannot follow yourself" }, 400);
    }

    const userToFollow = await db.query.user.findFirst({
      where: eq(user.id, followingId),
      columns: {
        id: true,
      },
    });

    if (!userToFollow) {
      return c.json({ success: false, error: "User not found" }, 404);
    }

    await db
      .insert(follows)
      .values({
        followerId: follower.id,
        followingId,
      })
      .onConflictDoNothing();

    await sendNotification(c.env.blogify_notifications, {
      recepientId: followingId,
      actorId: follower.id,
      type: "follow",
      entityId: follower.id,
      entityType: "follow",
    });

    return c.json(
      { success: true, message: "User followed successfully" },
      200,
    );
  };
  unFollowUser = async (c: Context) => {
    const db = getDb(c.env.blogify_db);
    const unFollower = c.get("user");

    const followingId = c.req.param("id");

    if (!followingId) {
      return c.json({ success: false, error: "User not found" }, 404);
    }

    if (unFollower.id === followingId) {
      return c.json({ success: false, error: "Cannot Unfollow yourself" }, 400);
    }

    const userToUnFollow = await db.query.user.findFirst({
      where: eq(user.id, followingId),
      columns: {
        id: true,
      },
    });

    if (!userToUnFollow) {
      return c.json({ success: false, error: "User not found" }, 404);
    }

    await db.delete(follows).where(
      and(
        eq(follows.followerId, unFollower.id), // i am the one who was the follower
        eq(follows.followingId, followingId), // the followingId was the one who is being unfollowed
        // both these cheks make sure i don't delete entire relationship , i just delete the one specific row
      ),
    );
    return c.json(
      { success: true, message: "User Unfollowed successfully" },
      200,
    );
  };

  getFollowers = async (c: Context) => {
    const db = getDb(c.env.blogify_db);
    const targetUserId = c.req.param("id");
    const requestingUser = c.get("user");

    if (!targetUserId) {
      return c.json({ success: false, error: "User not found" }, 404);
    }
    const targetUser = await db.query.user.findFirst({
      where: eq(user.id, targetUserId),
      columns: {
        id: true,
        isPublic: true,
      },
    });

    if (!targetUser) {
      return c.json({ success: false, error: "User not found" }, 404);
    }

    // like insta, dosar k follower/following list can only be visible when you follow them
    if (!targetUser?.isPublic && requestingUser.id !== targetUserId) {
      const isFollowing = await db.query.follows.findFirst({
        where: and(
          eq(follows.followerId, requestingUser.id),
          eq(follows.followingId, targetUserId),
        ),
        columns: { id: true },
      });

      if (!isFollowing) {
        return c.json(
          {
            success: false,
            error: "This account is Private",
          },
          403,
        );
      }
    }

    const { page, limit, offset } = getPagination(c.req.query());

    const total = await db.$count(
      follows,
      eq(follows.followingId, targetUserId),
    );

    const result = await db
      .select({
        id: user.id,
        name: user.name,
        image: user.image,
      })
      .from(follows)
      .innerJoin(user, eq(user.id, follows.followerId))
      .where(eq(follows.followingId, targetUserId))
      .limit(limit)
      .offset(offset);

    return c.json(
      {
        success: true,
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
  getFollowing = async (c: Context) => {
    const db = getDb(c.env.blogify_db);
    const targetUserId = c.req.param("id");
    if (!targetUserId) {
      return c.json({ success: false, error: "User not found" }, 404);
    }

    const requestingUser = c.get("user");

    const targetUser = await db.query.user.findFirst({
      where: eq(user.id, targetUserId),
      columns: {
        id: true,
        isPublic: true,
      },
    });
    if (!targetUser) {
      return c.json({ success: false, error: "User not found" }, 404);
    }
    if (!targetUser?.isPublic && requestingUser.id !== targetUserId) {
      const isFollowing = await db.query.follows.findFirst({
        where: and(
          eq(follows.followerId, requestingUser.id),
          eq(follows.followingId, targetUserId),
        ),
        columns: { id: true },
      });
      if (!isFollowing) {
        return c.json(
          { success: false, error: "This account is Private" },
          403,
        );
      }
    }

    const { page, limit, offset } = getPagination(c.req.query());

    const total = await db.$count(
      follows,
      eq(follows.followerId, targetUserId),
    );

    const result = await db
      .select({
        id: user.id,
        name: user.name,
        image: user.image,
      })
      .from(follows)
      .innerJoin(user, eq(user.id, follows.followingId))
      .where(eq(follows.followerId, targetUserId))
      .limit(limit)
      .offset(offset);
    return c.json(
      {
        success: true,
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
}

export const followsController = new FollowsController();
