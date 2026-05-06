PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_shares` (
	`id` text PRIMARY KEY NOT NULL,
	`blog_id` text NOT NULL,
	`user_id` text,
	`platform` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`blog_id`) REFERENCES `blogs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_shares`("id", "blog_id", "user_id", "platform", "created_at", "updated_at") SELECT "id", "blog_id", "user_id", "platform", "created_at", "updated_at" FROM `shares`;--> statement-breakpoint
DROP TABLE `shares`;--> statement-breakpoint
ALTER TABLE `__new_shares` RENAME TO `shares`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `platform_blogid_idx` ON `shares` (`blog_id`);--> statement-breakpoint
CREATE TABLE `__new_comment_likes` (
	`comment_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	PRIMARY KEY(`comment_id`, `user_id`),
	FOREIGN KEY (`comment_id`) REFERENCES `comments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_comment_likes`("comment_id", "user_id", "created_at", "updated_at") SELECT "comment_id", "user_id", "created_at", "updated_at" FROM `comment_likes`;--> statement-breakpoint
DROP TABLE `comment_likes`;--> statement-breakpoint
ALTER TABLE `__new_comment_likes` RENAME TO `comment_likes`;--> statement-breakpoint
CREATE INDEX `comments_likes_commentid_idx` ON `comment_likes` (`comment_id`);--> statement-breakpoint
CREATE INDEX `comments_likes_userid_idx` ON `comment_likes` (`user_id`);--> statement-breakpoint
CREATE TABLE `__new_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`blog_id` text NOT NULL,
	`author_id` text NOT NULL,
	`content` text NOT NULL,
	`parent_id` text,
	`root_id` text,
	`like_count` integer DEFAULT 0 NOT NULL,
	`reply_count` integer DEFAULT 0 NOT NULL,
	`deleted` integer DEFAULT false NOT NULL,
	`edited` integer DEFAULT false NOT NULL,
	`edited_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`blog_id`) REFERENCES `blogs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_comments`("id", "blog_id", "author_id", "content", "parent_id", "root_id", "like_count", "reply_count", "deleted", "edited", "edited_at", "created_at", "updated_at") SELECT "id", "blog_id", "author_id", "content", "parent_id", "root_id", "like_count", "reply_count", "deleted", "edited", "edited_at", "created_at", "updated_at" FROM `comments`;--> statement-breakpoint
DROP TABLE `comments`;--> statement-breakpoint
ALTER TABLE `__new_comments` RENAME TO `comments`;--> statement-breakpoint
CREATE INDEX `comments_blogid_idx` ON `comments` (`blog_id`);--> statement-breakpoint
CREATE INDEX `comments_parentid_idx` ON `comments` (`parent_id`);--> statement-breakpoint
CREATE INDEX `comments_authorid_idx` ON `comments` (`author_id`);--> statement-breakpoint
CREATE INDEX `comments_rootid_idx` ON `comments` (`root_id`);--> statement-breakpoint
ALTER TABLE `user` ADD `role` text DEFAULT 'user' NOT NULL;--> statement-breakpoint
CREATE INDEX `notifications_read_idx` ON `notifications` (`read`);