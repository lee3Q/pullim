import { GoogleGenerativeAI } from "@google/generative-ai";
import { LLMProvider, ChatParams, ChatResponse } from "./types";

let genAI: GoogleGenerativeAI | null = null;

// 리서치 후 모델명 확정 예정
const MODEL = process.env.GEMINI_MODEL || "gemini-3.1-pro-preview";

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_AI_API_KEY is not set");
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export const geminiProvider: LLMProvider = {
  name: "gemini",

  async chat(params: ChatParams): Promise<ChatResponse> {
    const start = Date.now();
    const model = getGenAI().getGenerativeModel({ model: MODEL });

    // Gemini는 system instruction을 별도로 설정
    const chat = model.startChat({
      history: params.messages.slice(0, -1).map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      systemInstruction: params.system,
      generationConfig: {
        maxOutputTokens: params.maxTokens,
        temperature: params.temperature ?? 0.7,
      },
    });

    const lastMessage = params.messages[params.messages.length - 1];
    const result = await chat.sendMessage(lastMessage?.content ?? "");
    const text = result.response.text();

    return {
      text,
      usage: {
        inputTokens: result.response.usageMetadata?.promptTokenCount ?? 0,
        outputTokens: result.response.usageMetadata?.candidatesTokenCount ?? 0,
      },
      latencyMs: Date.now() - start,
      model: MODEL,
    };
  },

  isAvailable(): boolean {
    return !!process.env.GOOGLE_AI_API_KEY;
  },
};
