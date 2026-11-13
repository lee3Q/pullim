import { detectCrisis } from "../safety/crisis-detector.ts";
import {
  unravelConcern,
  type PerspectiveLensId,
  type UnravelResult,
} from "./unravel-engine.ts";

export type OpenSourceProviderType =
  | "builtin"
  | "ollama"
  | "openai"
  | "anthropic"
  | "gemini";

export interface ProviderConfig {
  provider: OpenSourceProviderType;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export interface EnhancedUnravelResponse {
  result: UnravelResult;
  providerUsed: OpenSourceProviderType;
  modelUsed: string;
  aiSynthesisNote: string | null;
  fallbackReason?: string;
}

function buildSocraticSystemPrompt(lens: PerspectiveLensId): string {
  return [
    "당신은 오픈소스 의사결정·사고 구조화 도우미 '풀림(Pullim)'의 메타인지 엔진입니다.",
    "절대 사용자를 대신해 최종 결정을 내리거나 진단하지 마세요.",
    "사용자의 고민에서 (1) 확인된 사실과 미검증 가정의 분리, (2) 놓치고 있는 제3의 대안, (3) 오늘 10분 안에 실행할 수 있는 가역적 실험 1가지를 3~4문장으로 간결하고 날카롭게 짚어주세요.",
    `현재 선택된 시선 렌즈: ${lens}`,
  ].join("\n");
}

async function callExternalProvider(
  concern: string,
  lens: PerspectiveLensId,
  config: ProviderConfig,
): Promise<{ text: string; model: string }> {
  const systemPrompt = buildSocraticSystemPrompt(lens);

  if (config.provider === "ollama") {
    const baseUrl = (
      config.baseUrl ||
      process.env.OLLAMA_BASE_URL ||
      "http://127.0.0.1:11434"
    ).replace(/\/$/, "");
    const model = config.model || process.env.OLLAMA_MODEL || "llama3.2";
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: concern },
        ],
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
    const data = (await res.json()) as { message?: { content?: string } };
    const text = data.message?.content?.trim();
    if (!text) throw new Error("Empty Ollama response");
    return { text, model };
  }

  if (config.provider === "openai") {
    const apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OpenAI API key not configured");
    const baseUrl = (
      config.baseUrl ||
      process.env.OPENAI_BASE_URL ||
      "https://api.openai.com/v1"
    ).replace(/\/$/, "");
    const model = config.model || "gpt-4o-mini";
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: concern },
        ],
        max_tokens: 450,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("Empty OpenAI response");
    return { text, model };
  }

  if (config.provider === "anthropic") {
    const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("Anthropic API key not configured");
    const model = config.model || "claude-3-5-sonnet-latest";
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 450,
        system: systemPrompt,
        messages: [{ role: "user", content: concern }],
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`Anthropic HTTP ${res.status}`);
    const data = (await res.json()) as {
      content?: { type?: string; text?: string }[];
    };
    const text = data.content?.find((c) => c.type === "text")?.text?.trim();
    if (!text) throw new Error("Empty Anthropic response");
    return { text, model };
  }

  if (config.provider === "gemini") {
    const apiKey = config.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Gemini API key not configured");
    const model = config.model || "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: concern }] }],
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) throw new Error("Empty Gemini response");
    return { text, model };
  }

  throw new Error(`Unsupported provider: ${config.provider}`);
}

export async function runUnravelWithGateway(
  concern: string,
  lens: PerspectiveLensId = "structural",
  config: ProviderConfig = { provider: "builtin" },
): Promise<EnhancedUnravelResponse> {
  // Always run deterministic crisis check first — never send Tier A crisis to external LLM
  const crisis = detectCrisis(concern);
  const baseResult = unravelConcern(concern, { preferredLens: lens });

  if (crisis.tier === "A" || baseResult.haltedByCrisis || config.provider === "builtin") {
    return {
      result: baseResult,
      providerUsed: "builtin",
      modelUsed: "pullim-deterministic-socratic-v2",
      aiSynthesisNote: null,
    };
  }

  try {
    const { text, model } = await callExternalProvider(concern, lens, config);
    return {
      result: baseResult,
      providerUsed: config.provider,
      modelUsed: model,
      aiSynthesisNote: text,
    };
  } catch (err) {
    return {
      result: baseResult,
      providerUsed: "builtin",
      modelUsed: "pullim-deterministic-socratic-v2",
      aiSynthesisNote: null,
      fallbackReason:
        err instanceof Error
          ? `${config.provider} 연결 실패로 내장 소크라테스 엔진으로 자동 전환되었습니다 (${err.message}).`
          : "외부 모델 연결 실패로 내장 소크라테스 엔진으로 자동 전환되었습니다.",
    };
  }
}
