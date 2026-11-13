import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.GLM_API_KEY;
    const baseURL = !process.env.ANTHROPIC_API_KEY && process.env.GLM_BASE_URL
      ? process.env.GLM_BASE_URL
      : undefined;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY or GLM_API_KEY is not set");
    client = new Anthropic({ apiKey, ...(baseURL && { baseURL }) });
  }
  return client;
}

// Routing: Haiku (저비용, 빠름)
export const ROUTING_MODEL = "claude-haiku-4-5-20251001";

// GLM fallback: ANTHROPIC_API_KEY 없으면 GLM_MODEL 사용
const glmFallback = !process.env.ANTHROPIC_API_KEY && process.env.GLM_MODEL
  ? process.env.GLM_MODEL : null;

// Pipeline: Sonnet (메인 LLM) — 환경변수로 테스트 시 Haiku 등으로 전환 가능
export const PIPELINE_MODEL = process.env.PIPELINE_MODEL || glmFallback || "claude-sonnet-4-6";

// Analysis: Sonnet (에이전트 분석/토론 — Opus 대비 비용 절감)
export const ANALYSIS_MODEL = process.env.ANALYSIS_MODEL || glmFallback || "claude-sonnet-4-6";
