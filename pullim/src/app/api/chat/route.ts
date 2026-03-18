import { NextRequest } from "next/server";
import { getClient, PIPELINE_MODEL } from "@/lib/llm/claude";
import { buildSystemPrompt } from "@/lib/llm/prompts";
import { detectCrisis } from "@/lib/safety/crisis-detector";
import { Message, ModelType, StageName } from "@/lib/types";

const SAFETY_GUARD_PROMPT = `[안전 가드 — 활성]
사용자가 심리적으로 힘든 상태일 수 있습니다.
다음을 반드시 지켜주세요:
1. 절대 고통을 축소하거나 "다 괜찮아질 거예요" 같은 빈말 금지
2. 사용자의 감정을 먼저 인정 ("많이 힘드시죠", "그 마음 충분히 이해해요")
3. 응답 마지막에 자연스럽게 한 줄 삽입: "혼자 감당하기 어려우시면, 1393(자살예방상담전화)에서 24시간 이야기를 들어줍니다."
4. 질문은 가볍게, 깊이 파고들지 않기
5. "안 한다" 옵션을 항상 제시

`;

export async function POST(req: NextRequest) {
  const { messages, stage, modelType } = (await req.json()) as {
    messages: Message[];
    stage: StageName;
    modelType: ModelType;
  };

  const encoder = new TextEncoder();

  // [안전 레이어] 마지막 사용자 메시지 위기 감지 — LLM 호출 전
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  let systemPrompt = buildSystemPrompt(stage, modelType);

  if (lastUserMsg) {
    const crisisResult = detectCrisis(lastUserMsg.content);

    if (crisisResult.tier === "A") {
      // Tier A: LLM 호출 없이 즉시 위기 응답 스트림 반환
      const crisisStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                text: crisisResult.response!.userMessage,
                crisis: true,
                tier: "A",
                hotlines: crisisResult.response!.hotlines,
              })}\n\n`
            )
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });
      return new Response(crisisStream, {
        headers: { "Content-Type": "text/event-stream" },
      });
    }

    if (crisisResult.tier === "B") {
      // Tier B: 시스템 프롬프트 앞에 안전 가드 prepend
      systemPrompt = SAFETY_GUARD_PROMPT + systemPrompt;
    }
  }

  let client;
  try {
    client = getClient();
  } catch (error) {
    console.error("Claude client init error:", error);
    const errorStream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ text: "AI 서비스에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요." })}\n\n`
          )
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });
    return new Response(errorStream, {
      headers: { "Content-Type": "text/event-stream" },
    });
  }

  const claudeMessages = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = client.messages.stream({
          model: PIPELINE_MODEL,
          max_tokens: 1024,
          system: systemPrompt,
          messages: claudeMessages,
        });

        stream.on("text", (text) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
          );
        });

        await stream.finalMessage();
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        console.error("Streaming error:", error);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ text: "AI 서비스에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요.", error: true })}\n\n`
          )
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
