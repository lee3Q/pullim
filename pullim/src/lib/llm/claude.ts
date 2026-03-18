import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    client = new Anthropic({ apiKey });
  }
  return client;
}

// Routing: Haiku (저비용, 빠름)
export const ROUTING_MODEL = "claude-haiku-4-5-20251001";

// Pipeline: Sonnet (메인 LLM)
export const PIPELINE_MODEL = "claude-sonnet-4-6";

// Analysis: Sonnet (에이전트 분석/토론 — Opus 대비 비용 절감)
export const ANALYSIS_MODEL = "claude-sonnet-4-6";
