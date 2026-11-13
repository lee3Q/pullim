import { LLMProvider, ChatParams, ChatResponse } from "./types";

// OpenAI SDK — 리서치 후 모델명 확정 예정
const MODEL = process.env.OPENAI_MODEL || "gpt-5.4";

export const openaiProvider: LLMProvider = {
  name: "gpt",

  async chat(params: ChatParams): Promise<ChatResponse> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

    const start = Date.now();

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: params.maxTokens,
        temperature: params.temperature ?? 0.7,
        messages: [
          { role: "system", content: params.system },
          ...params.messages,
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];

    return {
      text: choice?.message?.content ?? "",
      usage: {
        inputTokens: data.usage?.prompt_tokens ?? 0,
        outputTokens: data.usage?.completion_tokens ?? 0,
      },
      latencyMs: Date.now() - start,
      model: MODEL,
    };
  },

  isAvailable(): boolean {
    return !!process.env.OPENAI_API_KEY;
  },
};
