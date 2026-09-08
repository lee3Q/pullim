import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { LLMProvider, ChatParams, ChatResponse } from "./types";

const GLM_MODEL = process.env.GLM_MODEL || "GLM-5";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.GLM_API_KEY;
    const baseURL = process.env.GLM_BASE_URL;
    if (!apiKey) throw new Error("GLM_API_KEY is not set");
    client = new Anthropic({ apiKey, baseURL });
  }
  return client;
}

export const glmProvider: LLMProvider = {
  name: "glm",

  async chat(params: ChatParams): Promise<ChatResponse> {
    const start = Date.now();
    const response = await getClient().messages.create({
      model: GLM_MODEL,
      max_tokens: params.maxTokens,
      temperature: params.temperature,
      system: params.system,
      messages: params.messages.map((m) => ({
        role: m.role === "system" ? "user" : m.role,
        content: m.content,
      })),
    }, { timeout: 180_000 });  // 180초 — z.ai 게이트웨이 특성 반영

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    return {
      text,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
      latencyMs: Date.now() - start,
      model: GLM_MODEL,
    };
  },

  isAvailable(): boolean {
    return !!(process.env.GLM_API_KEY && process.env.GLM_BASE_URL);
  },
};
