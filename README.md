![License](https://img.shields.io/badge/License-MIT-green?style=flat)

# Blogify API

Backend for Blogify, an AI-powered blogging platform running on Cloudflare Workers.

![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=flat&logo=cloudflare&logoColor=white)
![Hono](https://img.shields.io/badge/Hono-E36002?style=flat&logo=hono&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Better Auth](https://img.shields.io/badge/Better_Auth-000000?style=flat&logoColor=white)
![D1](https://img.shields.io/badge/Cloudflare-D1-F38020?style=flat&logo=cloudflare&logoColor=white)

## Live API + Docs

Production endpoint and Swagger docs for the API.

- Root API: https://blogify-api.shivamkarn.workers.dev
- Swagger UI: https://blogify-api.shivamkarn.workers.dev/docs

## Stack

- **Hono** — routing and middleware
- **Better Auth** — session-based authentication with OAuth
- **Cloudflare D1** — SQLite database at the edge
- **Cloudflare KV** — rate limiting and caching support
- **Cloudflare Queues** — background notification processing
- **Drizzle ORM** — type-safe queries and schema management

## What it does

- Publishes and manages blog posts with tags, drafts, and cover images
- Supports comments, threaded replies, and reactions
- Allows following users with follower-based notifications
- Queues notifications for background processing
- Exposes OpenAPI docs for the full REST API

## Architecture

```
Request
	└── Hono Router
				├── /api/blogs/**    → Optional Auth → Blog Controller → D1
				├── /api/users/**    → Auth Middleware → Follow Controller → D1
				└── Queue Consumer   → Notifications → D1
```

## Docs

All API endpoints are fully documented at the Swagger docs page:

- https://blogify-api.shivamkarn.workers.dev/docs
