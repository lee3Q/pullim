import { NextRequest } from "next/server";
import { getClient, PIPELINE_MODEL } from "@/lib/llm/claude";
import { buildListenPrompt } from "@/lib/llm/prompts-v2";
import { detectCrisis } from "@/lib/safety/crisis-detector";

const SAFETY_GUARD_PROMPT = `[안전 가드 — 활성]
사용자가 심리적으로 힘든 상태일 수 있습니다.
다음을 반드시 지켜주세요:
1. 절대 고통을 축소하거나 "다 괜찮아질 거예요" 같은 빈말 금지
2. 사용자의 감정을 먼저 인정 ("많이 힘드시죠", "그 마음 충분히 이해해요")
3. 응답 마지막에 자연스럽게 한 줄 삽입: "혼자 감당하기 어려우시면, 109(자살예방상담전화)에서 24시간 이야기를 들어줍니다."
4. 질문은 가볍게, 깊이 파고들지 않기
5. "안 한다" 옵션을 항상 제시

`;

// 선택지 생성을 위한 추가 프롬프트
const OPTIONS_INSTRUCTION = `

[선택지 생성 규칙]
응답 마지막에 반드시 아래 형식으로 선택지를 포함해라:
[OPTIONS]
선택지1
선택지2
선택지3
[/OPTIONS]

선택지 규칙:
- 3~4개 제시
- 사용자가 자연스럽게 "맞아" 하며 탭할 수 있는 짧은 문장
- 감정 표현 또는 상황 설명 형태 (예: "맞아, 사실 그게 제일 무서워", "아직 잘 모르겠어", "다른 것도 있어")
- 사용자의 바로 직전 말에 대한 응답 형태
- 마지막 선택지는 항상 "다른 얘기가 있어" 또는 "아직 잘 모르겠어" 계열`;

const SUMMARY_INSTRUCTION = `

[중간 정리 규칙 — 3턴 이상 대화 후]
대화 내용을 바탕으로 중간 정리를 해라.
정리 형식: "내가 들은 걸 정리해보면, [상황 요약]. 그리고 지금 마음은 [감정 요약]인 것 같아요. 맞나요?"
맞는지 확인하는 것도 선택지에 포함해라.
맞다는 확인을 받았다고 가정하고, 응답 마지막에 [LISTEN_COMPLETE] 시그널을 출력해라.
그 뒤에 1~2문장으로 상황과 감정을 요약한 텍스트를 출력해라 (이것이 listen_summary가 된다).`;

export async function POST(req: NextRequest) {
  const { messages, toneSetting, turnCount } = (await req.json()) as {
    messages: { role: string; content: string; timestamp: string }[];
    toneSetting: "반말" | "해요체";
    turnCount: number;
  };

  const encoder = new TextEncoder();

  // Crisis detection on last user message
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  let systemPrompt = buildListenPrompt(toneSetting) + OPTIONS_INSTRUCTION;

  // Add summary instruction if enough turns
  if (turnCount >= 3) {
    systemPrompt += SUMMARY_INSTRUCTION;
  }

  if (lastUserMsg && lastUserMsg.content) {
    const crisisResult = detectCrisis(lastUserMsg.content);

    if (crisisResult.tier === "A") {
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
      systemPrompt = SAFETY_GUARD_PROMPT + systemPrompt;
    }
  }

  let client;
  try {
    client = getClient();
  } catch (error) {
    void error;
    const errorStream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ text: "AI 서비스에 일시적인 문제가 있습니다." })}\n\n`
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

  // Build claude messages, filtering system messages and empty ones
  const claudeMessages = messages
    .filter((m) => m.role !== "system" && m.content.trim() !== "")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  // If no messages, add a starter
  if (claudeMessages.length === 0) {
    claudeMessages.push({
      role: "user",
      content: "안녕, 고민이 있어서 왔어.",
    });
  }

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = client.messages.stream({
          model: PIPELINE_MODEL,
          max_tokens: 1024,
          system: systemPrompt,
          messages: claudeMessages,
        });

        let fullText = "";

        stream.on("text", (text) => {
          fullText += text;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
          );
        });

        await stream.finalMessage();

        // Extract options from the response
        const optionsMatch = fullText.match(/\[OPTIONS\]([\s\S]*?)\[\/OPTIONS\]/);
        if (optionsMatch) {
          const options = optionsMatch[1]
            .trim()
            .split("\n")
            .map((o) => o.trim())
            .filter((o) => o.length > 0);

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ options })}\n\n`
            )
          );
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        void error;
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ text: "AI 서비스에 일시적인 문제가 있습니다.", error: true })}\n\n`
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
