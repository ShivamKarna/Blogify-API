import { Context } from "hono";
import { geminiFunctions } from "./gemini.helper";
import {
  generatePostSchema,
  generateExcerptSchema,
  generateTitlesSchema,
  suggestTagsSchema,
  improveTextSchema,
} from "./gemini.schemas";

class GeminiController {
  generatePost = async (c: Context) => {
    const userInput = await c.req.json();
    const parsed = generatePostSchema.safeParse(userInput);

    if (!parsed.success) {
      return c.json({ success: false, error: parsed.error.issues }, 400);
    }

    const content = await geminiFunctions.generatePost(
      c.env.GEMINI_API_KEY,
      parsed.data.topic,
      parsed.data.tone,
      parsed.data.length,
    );

    return c.json({ success: true, data: { content } }, 200);
  };
  generateTitles = async (c: Context) => {
    const userInput = await c.req.json();
    const parsed = generateTitlesSchema.safeParse(userInput);

    if (!parsed.success) {
      return c.json({ success: false, error: parsed.error.issues }, 400);
    }

    if (!parsed.data.topic && !parsed.data.content) {
      return c.json(
        { success: false, error: "topic or content is required" },
        400,
      );
    }

    const titles = await geminiFunctions.generateTitles(
      c.env.GEMINI_API_KEY,
      parsed.data.topic,
      parsed.data.content,
    );

    return c.json({ success: true, data: { titles } }, 200);
  };
  generateExcerpt = async (c: Context) => {
    const userInput = await c.req.json();
    const parsed = generateExcerptSchema.safeParse(userInput);

    if (!parsed.success) {
      return c.json({ success: false, error: parsed.error.issues }, 400);
    }

    const excerpt = await geminiFunctions.generateExcerpt(
      c.env.GEMINI_API_KEY,
      parsed.data.content,
    );

    return c.json({ success: true, data: { excerpt } }, 200);
  };
  suggestTags = async (c: Context) => {
    const userInput = await c.req.json();
    const parsed = suggestTagsSchema.safeParse(userInput);

    if (!parsed.success) {
      return c.json({ success: false, error: parsed.error.issues }, 400);
    }

    const tags = await geminiFunctions.suggestTags(
      c.env.GEMINI_API_KEY,
      parsed.data.title,
      parsed.data.content,
    );

    return c.json({ success: true, data: { tags } }, 200);
  };
  improveText = async (c: Context) => {
    const userInput = await c.req.json();
    const parsed = improveTextSchema.safeParse(userInput);

    if (!parsed.success) {
      return c.json({ success: false, error: parsed.error.issues }, 400);
    }

    const improved = await geminiFunctions.improveText(
      c.env.GEMINI_API_KEY,
      parsed.data.text,
      parsed.data.instruction,
    );

    return c.json({ success: true, data: { improved } }, 200);
  };
}

export const geminiController = new GeminiController();
