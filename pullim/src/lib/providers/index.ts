import { ModelProvider } from "@/lib/types-ultimate";
import { LLMProvider, ChatParams, ChatResponse } from "./types";
import { claudeProvider } from "./claude";
import { openaiProvider } from "./openai";
import { geminiProvider } from "./gemini";
import { localProvider } from "./local";

const PROVIDERS: Record<ModelProvider, LLMProvider> = {
  claude: claudeProvider,
  gpt: openaiProvider,
  gemini: geminiProvider,
  local: localProvider,
};

export function getProvider(name: ModelProvider): LLMProvider {
  return PROVIDERS[name];
}

export function getAvailableProviders(): ModelProvider[] {
  return (Object.entries(PROVIDERS) as [ModelProvider, LLMProvider][])
    .filter(([, p]) => p.isAvailable())
    .map(([name]) => name);
}

// 병렬 호출 — 실패한 모델은 Error로 반환
export async function parallelChat(
  calls: { provider: ModelProvider; params: ChatParams }[]
): Promise<{ provider: ModelProvider; result: ChatResponse | Error }[]> {
  const results = await Promise.allSettled(
    calls.map(async ({ provider, params }) => {
      const p = getProvider(provider);
      if (!p.isAvailable()) {
        throw new Error(`${provider} is not available (API key missing)`);
      }
      const result = await p.chat(params);
      return { provider, result };
    })
  );

  return results.map((r, i) => {
    if (r.status === "fulfilled") {
      return r.value;
    }
    return {
      provider: calls[i].provider,
      result: r.reason instanceof Error ? r.reason : new Error(String(r.reason)),
    };
  });
}

export type { LLMProvider, ChatParams, ChatResponse };
