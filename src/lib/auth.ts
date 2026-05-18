import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { BindingsType } from "./types";

const buildAuth = (
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
  const drizzleDb = drizzle(db);
  return betterAuth({
    database: drizzleAdapter(drizzleDb, {
      provider: "sqlite",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    secret: bindings.BETTER_AUTH_SECRET,
    baseURL: bindings.BETTER_AUTH_URL,
    trustedOrigins: [
      "http://localhost:8787",
      "http://localhost:5173",
      "https://blogify-api.shivamkarn.workers.dev",
    ],
    secondaryStorage: {
      get: async (key) => {
        const val = await bindings.blogify_kv.get(key);
        return val ?? null;
      },
      set: async (key, value, ttl) => {
        await bindings.blogify_kv.put(key, value, {
          expirationTtl: ttl ? Math.max(ttl, 60) : 86400,
        });
      },
      delete: async (key) => {
        await bindings.blogify_kv.delete(key);
      },
    },
    advanced: {
      ipAddress: {
        ipAddressHeaders: ["cf-connecting-ip"],
      },
    },
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
          input: true,
        },
      },
    },
  });
};

let cachedAuth: ReturnType<typeof buildAuth> | undefined;

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
  if (cachedAuth) {
    return cachedAuth;
  }
  cachedAuth = buildAuth(db, bindings);
  return cachedAuth;
};

export { getBetterAuthInstance };
