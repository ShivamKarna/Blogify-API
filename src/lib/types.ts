export type User = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null | undefined;
  createdAt: Date;
  updatedAt: Date;
};

export type BindingsType = {
  DB: D1Database;
  KV: KVNamespace;

  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;

  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;

  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;

  DISCORD_CLIENT_ID: string;
  DISCORD_CLIENT_SECRET: string;

  GEMINI_API_KEY: string;

  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_UPLOAD_PRESET: string;

  ENVIRONMENT: string;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: string;
  image: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
};
export type Variables = {
  user: AuthUser;
  session: {
    id: string;
    userId: string;
    expiresAt: string;
  };
};
