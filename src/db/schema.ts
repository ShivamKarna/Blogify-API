// Better auth generated schemas : user, session, account, verification
// Custom tables :
/*
blogs
reactions
comments
commentLikes
savedPosts
follows
shares
notifications

 */
import { relations, sql } from "drizzle-orm";
import {
  sqliteTable,
  primaryKey,
  text,
  integer,
  index,
  unique,
} from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`), // or dosar trika is : .$default(()=> Date.now())

  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => new Date()),
};
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .default(false)
    .notNull(),
  image: text("image"),
  role: text("role").default("user").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", {
      mode: "timestamp_ms",
    }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", {
      mode: "timestamp_ms",
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const blogs = sqliteTable(
  "blogs",
  {
    // id, authorId, title, subTitle, excerpt, slug, tags, content, coverIimage, published, aiGenerated, viewCount, shareCout, timestamps
    // idx at authorid, slug, published, createdAt
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    subTitle: text("sub_title"),
    excerpt: text("excerpt"),
    slug: text("slug").notNull().unique(),
    tags: text("tags"),
    content: text("content").notNull(),
    coverImage: text("cover_image"), // Cloudinary URL
    published: integer("published", { mode: "boolean" })
      .notNull()
      .default(false),
    aiGenerated: integer("ai_generated", { mode: "boolean" })
      .notNull()
      .default(false),
    viewCount: integer("view_count").notNull().default(0),
    shareCount: integer("share_count").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    index("blogs_authorid_idx").on(table.authorId),
    index("blogs_slug_idx").on(table.slug),
    index("blogs_published_idx").on(table.published),
    index("blogs_createdat_idx").on(table.createdAt),
  ],
);

export const reactions = sqliteTable(
  "reactions",
  {
    // id, blogId, userId, type,
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    blogId: text("blog_id")
      .notNull()
      .references(() => blogs.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    type: text("type").notNull(),
  },
  (table) => [
    unique("reactions_blog_user_uniq").on(table.blogId, table.userId), // Prevents user from liking the same  blogpost more than once
    index("reactions_blogid_idx").on(table.blogId),
    index("reactions_userid_idx").on(table.userId),
  ],
);

export const comments = sqliteTable(
  "comments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    blogId: text("blog_id")
      .notNull()
      .references(() => blogs.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    content: text("content").notNull(),

    // threading
    parentId: text("parent_id"),
    rootId: text("root_id"),

    likeCount: integer("like_count").notNull().default(0),
    replyCount: integer("reply_count").notNull().default(0),

    // soft delete option
    deleted: integer("deleted", { mode: "boolean" }).notNull().default(false),

    edited: integer("edited", { mode: "boolean" }).notNull().default(false),
    editedAt: integer("edited_at", { mode: "timestamp_ms" }),

    ...timestamps,
  },
  (table) => [
    index("comments_blogid_idx").on(table.blogId),
    index("comments_parentid_idx").on(table.parentId),
    index("comments_authorid_idx").on(table.authorId),
    index("comments_rootid_idx").on(table.rootId),
  ],
);

export const commentLikes = sqliteTable(
  "comment_likes",
  {
    commentId: text("comment_id")
      .notNull()
      .references(() => comments.id, { onDelete: "cascade" }),

    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.commentId, table.userId] }),
    index("comments_likes_commentid_idx").on(table.commentId),
    index("comments_likes_userid_idx").on(table.userId),
  ],
);

export const savedPosts = sqliteTable(
  "saved_posts",
  {
    // userid, blogid, id, uniq
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    blogId: text("blog_id")
      .notNull()
      .references(() => blogs.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [
    unique("saved_posts_uniq").on(table.userId, table.blogId),
    index("saved_posts_userid_idx").on(table.userId),
    index("saved_posts_blogid_idx").on(table.blogId),
  ],
);

export const follows = sqliteTable(
  "follows",
  {
    // id, followerId, followingId, timestmp
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    followerId: text("follower_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    followingId: text("following_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    ...timestamps,
  },
  (table) => [
    unique("follows_follower_following_idx").on(
      table.followerId,
      table.followingId,
    ),
    index("follows_followerid_idx").on(table.followerId),
    index("follows_followingid_idx").on(table.followingId),
  ],
);

export const shares = sqliteTable(
  "shares",
  {
    // id, postId, userId, tiemstamps, platform where it was shared
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    blogId: text("blog_id")
      .notNull()
      .references(() => blogs.id, { onDelete: "cascade" }),

    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),

    platform: text("platform"),
    ...timestamps,
  },
  (table) => [index("platform_blogid_idx").on(table.blogId)],
);

export const notifications = sqliteTable(
  "notifications",
  {
    // id, reciever , actor, type, entityType, entity id, read or not
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    recipientId: text("recipient_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    actorId: text("actor_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    type: text("type").notNull(),
    entityType: text("entity_type").notNull(), // blog , comment, follow
    entityId: text("entity_id").notNull(),
    read: integer("read", { mode: "boolean" }).default(false),
    ...timestamps,
  },
  (table) => [
    index("notifications_recipientid_idx").on(table.recipientId),
    index("notifications_createdat_idx").on(table.createdAt),
    index("notifications_read_idx").on(table.read),
    index("notifications_recipient_read_idx").on(table.recipientId, table.read),
  ],
);

// Relations

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  blogs: many(blogs),
  comments: many(comments),
  reactions: many(reactions),
  savedPosts: many(savedPosts),
  shares: many(shares),
  followers: many(follows, { relationName: "followers" }),
  following: many(follows, { relationName: "following" }),
  recievedNotifications: many(notifications, {
    relationName: "recievedNotifications",
  }),
  sentNotifications: many(notifications, {
    relationName: "sentNotifications",
  }),
}));

export const blogsRelations = relations(blogs, ({ one, many }) => ({
  author: one(user, {
    fields: [blogs.authorId],
    references: [user.id],
  }),
  reactions: many(reactions),
  comments: many(comments),
  savedBy: many(savedPosts),
  shares: many(shares),
}));

export const reactionsRelations = relations(reactions, ({ one }) => ({
  reactedBy: one(user, {
    fields: [reactions.userId],
    references: [user.id],
  }),
  reactedTo: one(blogs, {
    fields: [reactions.blogId],
    references: [blogs.id],
  }),
}));

export const commentRelations = relations(comments, ({ one, many }) => ({
  author: one(user, {
    fields: [comments.authorId],
    references: [user.id],
  }),
  blog: one(blogs, {
    fields: [comments.blogId],
    references: [blogs.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: "replies",
  }),
  likes: many(commentLikes),
  replies: many(comments, { relationName: "replies" }),
}));

export const commentLikesRelations = relations(commentLikes, ({ one }) => ({
  comment: one(comments, {
    fields: [commentLikes.commentId],
    references: [comments.id],
  }),

  user: one(user, {
    fields: [commentLikes.userId],
    references: [user.id],
  }),
}));

export const savedPostRelations = relations(savedPosts, ({ one }) => ({
  user: one(user, {
    fields: [savedPosts.userId],
    references: [user.id],
  }),
  blog: one(blogs, {
    fields: [savedPosts.blogId],
    references: [blogs.id],
  }),
}));

export const followsRelations = relations(follows, ({ one, many }) => ({
  follower: one(user, {
    fields: [follows.followerId],
    references: [user.id],
    relationName: "following",
  }),
  following: one(user, {
    fields: [follows.followingId],
    references: [user.id],
    relationName: "followers",
  }),
}));
export const sharesRelations = relations(shares, ({ one }) => ({
  user: one(user, {
    fields: [shares.userId],
    references: [user.id],
  }),
  blog: one(blogs, {
    fields: [shares.blogId],
    references: [blogs.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  recipient: one(user, {
    fields: [notifications.recipientId],
    references: [user.id],
    relationName: "recievedNotifications",
  }),
  actor: one(user, {
    fields: [notifications.actorId],
    references: [user.id],
    relationName: "sentNotifications",
  }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));
