import { NextRequest } from "next/server";
import { getClient, PIPELINE_MODEL } from "@/lib/llm/claude";
import { detectCrisis } from "@/lib/safety/crisis-detector";
import { CRYSTALS, CrystalName } from "@/lib/types-ultimate";
import { isDemoMode, getDemoListenResponse } from "@/lib/demo";

const SAGE_SYSTEM_PROMPT = `너는 "현자"다. 모닥불 앞에 앉아 갈림길에 선 사람의 이야기를 듣는 존재.

[톤 규칙]
- 고어체: "~일세", "~인가", "~하게", "~이로군"
- 2-3문장 최대. 장황 금지.
- 따뜻하지만 직설적. 위로하지 않고 사실을 비춤.
- 과잉 친절 금지. "힘드셨죠?" 같은 대사 없음.

[금기어]
- "힘드셨죠", "괜찮아요", "화이팅", "고민이 많으시네요", "제가 도와드릴게요" — 절대 사용 금지.
- 대체: "무거운 짐을 졌군", "그것도 답일세", "가보게", "같이 들여다보지"

[역할]
- 사용자 고민을 경청하고 핵심을 파악한다.
- 한 번에 질문 1개만. 감정 반영 후 질문.
- 답을 주지 않는다. 질문으로 사용자가 스스로 명확화하게 한다.

[선택지 생성 규칙]
응답 마지막에 반드시 아래 형식으로 선택지를 포함:
[OPTIONS]
선택지1
선택지2
선택지3
[/OPTIONS]

선택지 규칙:
- 3~4개 제시
- 사용자가 "맞아" 하며 탭할 수 있는 짧은 문장
- 마지막 선택지는 "아직 잘 모르겠어" 또는 "다른 얘기가 있어" 계열
`;

const SUMMARY_INSTRUCTION = `

[중간 정리 — 지금 실행]
대화 내용을 바탕으로 중간 정리를 해라.
정리 형식: "{user_name}... 내가 들은 걸 정리해보겠네. [상황 1~2문장 요약]. 그리고 지금 마음은 [감정 1문장]인 것 같군. 맞는가?"

응답 마지막에 반드시 [LISTEN_COMPLETE] 시그널을 출력.
그 뒤에 1~2문장으로 상황과 감정을 요약한 텍스트를 출력 (이것이 listenSummary).
형식: [SUMMARY]요약 텍스트[/SUMMARY]

그리고 사용자 고민에 가장 적합한 수정구슬 3개를 추천해라.
아래 구슬 목록에서 고민과 가장 관련 깊은 3개를 선택:
${CRYSTALS.map((c) => `- ${c.name}: ${c.analysisFocus}`).join("\n")}

형식: [CRYSTALS]구슬1,구슬2,구슬3[/CRYSTALS]
`;

const SAFETY_GUARD_PROMPT = `[안전 가드 — 활성]
사용자가 심리적으로 힘든 상태일 수 있습니다.
1. 고통을 축소하거나 빈말 금지
2. 감정을 먼저 인정
3. 응답 마지막에 자연스럽게: "혼자 감당하기 어려우면, 109(자살예방상담전화)에서 24시간 이야기를 들어준다네."
4. 질문은 가볍게
5. "안 한다" 옵션 항상 제시

`;

export async function POST(req: NextRequest) {
  const { messages, userName, turnCount, theme } = (await req.json()) as {
    messages: { role: string; content: string }[];
    userName: string | null;
    turnCount: number;
    theme?: string;
  };

  const encoder = new TextEncoder();

  // Demo mode — API 키 없으면 mock 응답
  if (isDemoMode()) {
    const demo = getDemoListenResponse(turnCount, theme as "모험가" | "전략실" | "달빛정원" | undefined);
    const demoStream = new ReadableStream({
      async start(controller) {
        // 텍스트를 청크로 나눠 스트리밍 시뮬레이션
        const words = demo.text.split("");
        for (let i = 0; i < words.length; i += 3) {
          const chunk = words.slice(i, i + 3).join("");
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`)
          );
          await new Promise((r) => setTimeout(r, 30));
        }
        if ("options" in demo && demo.options) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ options: demo.options })}\n\n`)
          );
        }
        if ("listenSummary" in demo && demo.listenSummary) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ listenSummary: demo.listenSummary })}\n\n`)
          );
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ recommendedCrystals: ["금화", "나침반", "모닥불"] })}\n\n`)
          );
        }
        if ("listenComplete" in demo && demo.listenComplete) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ listenComplete: true })}\n\n`)
          );
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });
    return new Response(demoStream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
    });
  }

  // Crisis detection on last user message
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  let systemPrompt = SAGE_SYSTEM_PROMPT;

  if (userName) {
    systemPrompt += `\n사용자 이름: ${userName}\n`;
  }

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
  } catch {
    const errorStream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ text: "구슬이 흐려졌군... 잠시 후 다시 오게.", error: true })}\n\n`
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

  // 교차검증 지적: input validation 강화
  const claudeMessages = messages
    .filter((m) => m.role !== "system" && m.content.trim() !== "")
    .filter((m) => typeof m.content === "string" && m.content.length < 10000)
    .slice(-20)
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  if (claudeMessages.length === 0) {
    claudeMessages.push({ role: "user", content: "고민이 있어서 왔어." });
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

        // Extract options (교차검증: 태그 누락 시 기본값 제공)
        const optionsMatch = fullText.match(/\[OPTIONS\]([\s\S]*?)\[\/OPTIONS\]/);
        if (optionsMatch) {
          const options = optionsMatch[1]
            .trim()
            .split("\n")
            .map((o) => o.trim())
            .filter((o) => o.length > 0);

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ options })}\n\n`)
          );
        } else {
          // 태그 누락 방어: 기본 선택지 제공
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ options: ["계속 이야기할게", "다른 얘기가 있어", "잘 모르겠어"] })}\n\n`
            )
          );
        }

        // Extract listen summary (태그 누락 시 마지막 2문장 추출)
        const summaryMatch = fullText.match(/\[SUMMARY\]([\s\S]*?)\[\/SUMMARY\]/);
        if (summaryMatch) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ listenSummary: summaryMatch[1].trim() })}\n\n`
            )
          );
        } else if (turnCount >= 3) {
          // 태그 누락 방어: 전체 텍스트에서 요약 대체
          const cleanText = fullText
            .replace(/\[OPTIONS\][\s\S]*?\[\/OPTIONS\]/, "")
            .replace(/\[LISTEN_COMPLETE\]/, "")
            .trim();
          const sentences = cleanText.split(/[.!?。]\s*/).filter((s) => s.length > 10);
          const fallbackSummary = sentences.slice(-2).join(". ");
          if (fallbackSummary) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ listenSummary: fallbackSummary })}\n\n`
              )
            );
          }
        }

        // Extract recommended crystals (태그 누락 시 기본 3개)
        const crystalsMatch = fullText.match(/\[CRYSTALS\]([\s\S]*?)\[\/CRYSTALS\]/);
        if (crystalsMatch) {
          const crystalNames = crystalsMatch[1]
            .trim()
            .split(",")
            .map((c) => c.trim())
            .filter((c): c is CrystalName =>
              CRYSTALS.some((def) => def.name === c)
            );

          if (crystalNames.length > 0) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ recommendedCrystals: crystalNames })}\n\n`
              )
            );
          }
        } else if (turnCount >= 3) {
          // 태그 누락 방어: 기본 추천 구슬
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ recommendedCrystals: ["거울", "나침반", "모닥불"] })}\n\n`
            )
          );
        }

        // Check for listen complete signal
        const listenComplete = fullText.includes("[LISTEN_COMPLETE]") || (turnCount >= 4 && summaryMatch);
        if (listenComplete) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ listenComplete: true })}\n\n`
            )
          );
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ text: "구슬이 흐려졌군... 잠시 후 다시 오게.", error: true })}\n\n`
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
