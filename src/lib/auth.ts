import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import type { BindingsType } from "./types";

const getBetterAuthInstance = (
  db: D1Database,
  bindings: Pick<
    BindingsType,
    | "GOOGLE_CLIENT_ID"
    | "GOOGLE_CLIENT_SECRET"
    | "GITHUB_CLIENT_ID"
    | "GITHUB_CLIENT_SECRET"
    | "DISCORD_CLIENT_ID"
    | "DISCORD_CLIENT_SECRET"
    | "BETTER_AUTH_SECRET"
    | "BETTER_AUTH_URL"
    | "blogify_kv"
  >,
) => {
  const drizzleDb = drizzle(db, { schema });

  return betterAuth({
    database: drizzleAdapter(drizzleDb, {
      provider: "sqlite",
      schema: {
        user: schema.user,
        verification: schema.verification,
        session: schema.session,
        account: schema.account,
      },
    }),

    secret: bindings.BETTER_AUTH_SECRET,
    baseURL: bindings.BETTER_AUTH_URL,
    basePath: "/api/auth",

    trustedOrigins: [
      "http://localhost:8787",
      "http://localhost:5173",
      "https://blogify-api.shivamkarn.workers.dev",
    ],
    socialProviders: {
      google: {
        clientId: bindings.GOOGLE_CLIENT_ID,
        clientSecret: bindings.GOOGLE_CLIENT_SECRET,
      },
      github: {
        clientId: bindings.GITHUB_CLIENT_ID,
        clientSecret: bindings.GITHUB_CLIENT_SECRET,
      },
      discord: {
        clientId: bindings.DISCORD_CLIENT_ID,
        clientSecret: bindings.DISCORD_CLIENT_SECRET,
      },
    },

    user: {
      additionalFields: {
        role: {
          type: "string",
          defaultValue: "user",
          input: false,
        },
        isPublic: {
          type: "boolean",
          defaultValue: true,
          input: true, // added for public and private profile settign like instagram
        },
      },
    },
    secondaryStorage: {
      get: async (key) => {
        const value = await bindings.blogify_kv.get(key);
        return value;
      },
      set: async (key, value, ttl) => {
        if (ttl) {
          await bindings.blogify_kv.put(key, value, { expirationTtl: ttl });
        } else {
          await bindings.blogify_kv.put(key, value);
        }
      },
      delete: async (key) => {
        await bindings.blogify_kv.delete(key);
      },
    },
  });
};

export { getBetterAuthInstance };
