// users
// account
// session
// blog_post
// verification

import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => new Date())
    .notNull(),
};

const generateId = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

// id
//name
//email
//emailVerified : boolean
//image , handled by better auth automatically
export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  email: text("email").notNull(),
  emailVerified: integer("email_verified", { mode: "boolean" }),
  image: text("image"),
  ...timestamps,
});

// id
// accountId
// providerId
// userId
// accessToken
// refreshToken
// idToken
// accessTokenExpiresAt
// refreshTokenExpiresAt
// scope
// password
// createdAt
// updatedAt,
// idx userId
export const account = sqliteTable(
  "account",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
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
    ...timestamps,
  },
  (table) => [index("acc_userid_idx").on(table.userId)],
);

// Id
// userId : fkey
// Title
// Sub-Title
// Excerpt
// Slug
// Tags
// createdAt
// updatedAt,
// idx userid

export const blogs = sqliteTable(
  "blogs",
  {
    id: text("id")
      .primaryKey()
      .notNull()
      .$defaultFn(() => crypto.randomUUID()),
    userID: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    title: text("title").notNull(),
    subTitle: text("sub_title"),
    excerpt: text("excerpt"),
    slug: text("slug"),
    tags: text("tags"),
    ...timestamps,
  },
  (table) => [index("blogs_userid_idx").on(table.userID)],
);

// id
// token
// expiresAt
// ipAddress
// userAgent
// userId: fkey
// createdAt
// updatedAt,
// idx userIdexport
export const session = sqliteTable(
  "session",
  {
    id: text("id")
      .primaryKey()
      .notNull()
      .$defaultFn(() => crypto.randomUUID()),

    token: text("token").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),

    ...timestamps,
  },
  (table) => [index("session_userId_idx").on(table.userId)], // this userId might cause an issue?,badme dekhbai agr error aelai tab
);

// id;
// identifier;
// value;
// expiresAt;
// createdAt;
// updatedAt;
export const verification = sqliteTable("verification", {
  id: text("id")
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),

  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
  ...timestamps,
});
