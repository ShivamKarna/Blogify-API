import { z } from "zod";

export const generatePostSchema = z.object({
  topic: z.string().min(2),
  tone: z
    .enum(["professional", "casual", "humorous", "technical"])
    .default("professional"),
  length: z.enum(["short", "medium", "long"]).default("medium"),
});

export const generateTitlesSchema = z.object({
  topic: z.string().optional(),
  content: z.string().optional(),
});

export const generateExcerptSchema = z.object({
  content: z.string().min(10),
});

export const suggestTagsSchema = z.object({
  title: z.string().min(2),
  content: z.string().min(10),
});

export const improveTextSchema = z.object({
  text: z.string().min(2),
  instruction: z.string().default("improve clarity and engagement"),
});
