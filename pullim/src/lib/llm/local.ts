import "server-only";
// 로컬 LLM (Ollama) 스트리밍 헬퍼

const BASE_URL = process.env.LOCAL_LLM_BASE_URL || "http://localhost:11434";
const MODEL = process.env.LOCAL_LLM_MODEL || "qwen2.5:3b";

export function isLocalMode(): boolean {
  return process.env.LLM_MODE === "local";
}

export interface LocalStreamCallbacks {
  onText: (text: string) => void;
}

export async function localStream(params: {
  system: string;
  messages: { role: string; content: string }[];
  maxTokens: number;
  callbacks: LocalStreamCallbacks;
}): Promise<string> {
  const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: params.maxTokens,
      temperature: 0.7,
      stream: true,
      messages: [
        { role: "system", content: params.system },
        ...params.messages,
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Local LLM error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let fullText = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data: ")) continue;
      const data = trimmed.slice(6);
      if (data === "[DONE]") continue;

      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) {
          // Qwen3 thinking 태그 필터링 — <think>...</think> 블록 제거
          fullText += content;
          params.callbacks.onText(content);
        }
      } catch {
        // skip malformed JSON
      }
    }
  }

  return fullText;
}
