PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_blogs` (
	`id` text PRIMARY KEY NOT NULL,
	`author_id` text NOT NULL,
	`title` text NOT NULL,
	`excerpt` text,
	`slug` text NOT NULL,
	`tags` text,
	`content` text NOT NULL,
	`cover_image` text,
	`published` integer DEFAULT false NOT NULL,
	`ai_generated` integer DEFAULT false,
	`view_count` integer DEFAULT 0 NOT NULL,
	`share_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_blogs`("id", "author_id", "title", "excerpt", "slug", "tags", "content", "cover_image", "published", "ai_generated", "view_count", "share_count", "created_at", "updated_at") SELECT "id", "author_id", "title", "excerpt", "slug", "tags", "content", "cover_image", "published", "ai_generated", "view_count", "share_count", "created_at", "updated_at" FROM `blogs`;--> statement-breakpoint
DROP TABLE `blogs`;--> statement-breakpoint
ALTER TABLE `__new_blogs` RENAME TO `blogs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `blogs_slug_unique` ON `blogs` (`slug`);--> statement-breakpoint
CREATE INDEX `blogs_authorid_idx` ON `blogs` (`author_id`);--> statement-breakpoint
CREATE INDEX `blogs_slug_idx` ON `blogs` (`slug`);--> statement-breakpoint
CREATE INDEX `blogs_published_idx` ON `blogs` (`published`);--> statement-breakpoint
CREATE INDEX `blogs_createdat_idx` ON `blogs` (`created_at`);