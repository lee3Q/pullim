import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { LLMProvider, ChatParams, ChatResponse } from "./types";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    client = new Anthropic({ apiKey });
  }
  return client;
}

export const CLAUDE_MODELS = {
  haiku: "claude-haiku-4-5-20251001",
  sonnet: "claude-sonnet-4-6",
} as const;

export const claudeProvider: LLMProvider = {
  name: "claude",

  async chat(params: ChatParams): Promise<ChatResponse> {
    const start = Date.now();
    const response = await getClient().messages.create({
      model: CLAUDE_MODELS.sonnet,
      max_tokens: params.maxTokens,
      temperature: params.temperature,
      system: params.system,
      messages: params.messages.map((m) => ({
        role: m.role === "system" ? "user" : m.role,
        content: m.content,
      })),
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    return {
      text,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
      latencyMs: Date.now() - start,
      model: CLAUDE_MODELS.sonnet,
    };
  },

  isAvailable(): boolean {
    return !!process.env.ANTHROPIC_API_KEY;
  },
};
