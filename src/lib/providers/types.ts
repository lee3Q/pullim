// 멀티 모델 프로바이더 공통 인터페이스

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatParams {
  system: string;
  messages: ChatMessage[];
  maxTokens: number;
  temperature?: number;
}

export interface ChatResponse {
  text: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  latencyMs: number;
  model: string;
}

export interface LLMProvider {
  name: string;
  chat(params: ChatParams): Promise<ChatResponse>;
  isAvailable(): boolean;
}
