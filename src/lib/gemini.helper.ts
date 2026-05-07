const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// callGemini, generatePost, generateTitles, generateExcerpts, suggestTags, improveText
class GeminiFunctions {
  callGemini = async (
    apiKey: string,
    prompt: string,
    systemInstruction?: string,
    maxTokens = 2048,
  ): Promise<string> => {
    const body: Record<string, unknown> = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: maxTokens,
        topP: 0.95,
      },
    };

    if (systemInstruction) {
      body.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    const res = await fetch(
      `${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
    }
    const data = (await res.json()) as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
    };
    return data.candidates[0].content?.parts[0]?.text ?? "";
  };

  generatePost = async (
    apiKey: string,
    topic: string,
    tone: string,
    length: string,
  ) => {
    const wordCount =
      { short: "400-600", medium: "800-1200", long: "1500-2000" }[length] ??
      "800-1200";

    return this.callGemini(
      apiKey,
      `Write a ${tone} blog post about: "${topic}". Word count: ${wordCount}. Use markdown. No title in body.`,
      "You are an expert blog writer who creates well-structured, SEO-friendly content.",
      3000,
    );
  };

  generateTitles = async (
    apiKey: string,
    topic?: string,
    content?: string,
  ): Promise<string[]> => {
    const source = content
      ? `Based on this content:\n\n${content.slice(0, 1000)}`
      : `For a blog post about: "${topic}"`;

    const raw = await this.callGemini(
      apiKey,
      `${source}\n\nGenerate 5 compelling SEO-friendly titles. Return ONLY a JSON array:\n["Title 1","Title 2","Title 3","Title 4","Title 5"]`,
    );

    const match = raw.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : [];
  };

  generateExcerpt = async (
    apiKey: string,
    content: string,
  ): Promise<string> => {
    return this.callGemini(
      apiKey,
      `Summarize this blog post in 2-3 engaging sentences (max 160 chars) for use as a meta description:\n\n${content.slice(0, 3000)}`,
    );
  };

  suggestTags = async (
    apiKey: string,
    title: string,
    content: string,
  ): Promise<string[]> => {
    const raw = await this.callGemini(
      apiKey,
      `For blog post titled "${title}", suggest 5-8 relevant lowercase tags.\nReturn ONLY a JSON array: ["tag1","tag2"]\n\nContent: ${content.slice(0, 800)}`,
    );
    const match = raw.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : [];
  };

  improveText = async (
    apiKey: string,
    text: string,
    instruction: string,
  ): Promise<string> => {
    return this.callGemini(
      apiKey,
      `${instruction}:\n\n${text}\n\nReturn only the improved text, no explanation.`,
    );
  };

  //this is the last closing braces
}

export const geminiFunctions = new GeminiFunctions();
