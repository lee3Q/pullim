import { LLMProvider, ChatParams, ChatResponse } from "./types";

const BASE_URL = process.env.LOCAL_LLM_BASE_URL || "http://localhost:11434";
const MODEL = process.env.LOCAL_LLM_MODEL || "qwen3:4b";

export const localProvider: LLMProvider = {
  name: "local",

  async chat(params: ChatParams): Promise<ChatResponse> {
    const start = Date.now();

    const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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
      throw new Error(`Local LLM error: ${response.status} ${await response.text()}`);
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
    return !!process.env.LOCAL_LLM_BASE_URL || process.env.LLM_MODE === "local";
  },
};
