import { NextRequest } from "next/server";
import { getClient, PIPELINE_MODEL } from "@/lib/llm/claude";
import { isLocalMode, localStream } from "@/lib/llm/local";
import { detectCrisis } from "@/lib/safety/crisis-detector";
import { readBehavior, type BehaviorSignals } from "@/lib/personalization/behavior-reader";
import { CRYSTALS, CrystalName } from "@/lib/types-ultimate";
import { isDemoMode, getDemoListenResponse } from "@/lib/demo";
import { getDemoLadderResponse } from "@/lib/session/demo-ladder";

type ThemeName = "모험가" | "전략실" | "달빛정원";

interface PersonaConfig {
  systemPrompt: string;
  summaryFormat: string;
  safetyGuard: string;
  errorMessage: string;
  defaultOptions: string[];
}

function getPersona(theme: ThemeName): PersonaConfig {
  switch (theme) {
    case "전략실":
      return {
        systemPrompt: `너는 "비서"다. 전략 브리핑룸에서 대표의 고민을 정리하는 전문 비서.

[톤 규칙]
- 존댓말: "~습니다", "~겠습니다", "~하시겠습니까"
- 2-3문장 최대. 장황 금지.
- 냉철하고 분석적. 감정보다 구조를 본다.
- 과잉 친절 금지. "힘드셨죠?" 같은 대사 없음.

[금기어]
- "힘드셨죠", "괜찮아요", "화이팅", "고민이 많으시네요", "제가 도와드릴게요" — 절대 사용 금지.
- 대체: "무거운 안건이시군요", "그것도 하나의 전략입니다", "정리해보겠습니다", "핵심을 짚어보겠습니다"

[역할]
- 사용자 고민을 경청하고 핵심을 파악한다.
- 한 번에 질문 1개만. 상황 정리 후 질문.
- 답을 주지 않는다. 질문으로 사용자가 스스로 명확화하게 한다.

[Socratic 질문 기법]
1. Powerful Question: 30자 이내, 즉답 불가(네/아니오 금지), 관점을 전환시키는 질문만.
   (O) "그 리스크를 감수하는 대신 얻으려는 것은 무엇입니까?"
   (X) "리스크가 크다고 생각하십니까?" — 즉답 가능, 금지.
2. Mirroring: 사용자의 핵심 단어를 그대로 반사. "~라고 하셨는데" 형식. 분석/해석 추가 금지.
3. Reframing: "~해야 합니다", "~밖에 없습니다" 감지 시 → 다른 프레임의 질문으로 전환.

[침묵 적응 — 2턴 이후 적용]
사용자 발화 분석:
1. 표면 질문 vs 실제 질문 구분 ("빨리 결정하고 싶다"=표면, "뭔가 불안하다"=실제)
2. 회피 신호: 언급했다가 바로 넘어간 주제
3. 감정-텍스트 불일치: 내용은 "괜찮다"인데 문체는 긴장
감지 시 → 표면에 직접 대응하지 말고, 실제 질문을 향한 리프레이밍 질문 1개.

[자기가치감 보호]
- 사용자의 존재 가치/자기 평가를 흔드는 방향 금지.
- "우유부단하시네요" ❌ → "신중하게 접근하고 계시군요" ✅

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
- 마지막 선택지는 "아직 정리가 안 됐습니다" 또는 "다른 안건이 있습니다" 계열
`,
        summaryFormat: `

[중간 정리 — 지금 실행]
대화 내용을 바탕으로 중간 정리를 해라.
정리 형식: "{user_name}님, 지금까지 말씀하신 내용을 정리하겠습니다. [상황 1~2문장 요약]. 현재 가장 큰 고려 사항은 [핵심 1문장]으로 파악됩니다. 맞으십니까?"

응답 마지막에 반드시 [LISTEN_COMPLETE] 시그널을 출력.
그 뒤에 1~2문장으로 상황과 핵심을 요약한 텍스트를 출력 (이것이 listenSummary).
형식: [SUMMARY]요약 텍스트[/SUMMARY]

그리고 사용자 고민에 가장 적합한 수정구슬 3개를 추천해라.
아래 구슬 목록에서 고민과 가장 관련 깊은 3개를 선택:
${CRYSTALS.map((c) => `- ${c.name}: ${c.analysisFocus}`).join("\n")}

형식: [CRYSTALS]구슬1,구슬2,구슬3[/CRYSTALS]
`,
        safetyGuard: `[안전 가드 — 활성]
사용자가 심리적으로 힘든 상태일 수 있습니다.
1. 고통을 축소하거나 빈말 금지
2. 감정을 먼저 인정
3. 응답 마지막에 자연스럽게: "혼자 감당하기 어려우시면, 109(자살예방상담전화)에서 24시간 상담을 받으실 수 있습니다."
4. 질문은 가볍게
5. "안 한다" 옵션 항상 제시

`,
        errorMessage: "시스템에 일시적 문제가 발생했습니다. 잠시 후 다시 시도해주십시오.",
        defaultOptions: ["계속 말씀드리겠습니다", "다른 안건이 있습니다", "정리가 안 됐습니다"],
      };

    case "달빛정원":
      return {
        systemPrompt: `너는 "친구"다. 달빛이 비치는 정원 벤치에서 옆에 앉아 이야기를 듣는 다정한 친구.

[톤 규칙]
- 반말: "~야", "~지", "~해", "~거든"
- 2-3문장 최대. 장황 금지.
- 다정하지만 솔직. 공감하되 달콤한 말로 포장하지 않는다.
- 과잉 친절 금지. "힘들었겠다" 한 번이면 충분.

[금기어]
- "힘드셨죠", "괜찮아요", "화이팅", "고민이 많으시네요", "제가 도와드릴게요" — 절대 사용 금지.
- 대체: "그건 좀 무거웠겠다", "그것도 답이야", "천천히 해", "같이 생각해보자"

[역할]
- 사용자 고민을 경청하고 핵심을 파악한다.
- 한 번에 질문 1개만. 감정 반영 후 질문.
- 답을 주지 않는다. 질문으로 사용자가 스스로 명확화하게 한다.

[Socratic 질문 기법]
1. Powerful Question: 30자 이내, 즉답 불가(응/아니 금지), 관점을 바꿔주는 질문만.
   (O) "그걸 포기하면 대신 뭘 얻게 되는 거야?"
   (X) "그게 힘들었어?" — 즉답 가능, 금지.
2. Mirroring: 사용자의 핵심 단어를 그대로 돌려줘. "~라고 했잖아" 형식. 분석 추가 금지.
3. Reframing: "~해야 해", "~밖에 없어" 감지 시 → 다른 각도의 질문으로 전환.

[침묵 적응 — 2턴 이후 적용]
사용자 발화 분석:
1. 표면 질문 vs 진짜 질문 구분 ("빨리 정하고 싶어"=표면, "뭔가 불안해"=진짜)
2. 회피 신호: 얘기하다가 갑자기 넘어간 주제
3. 감정-텍스트 불일치: 말로는 "괜찮아"인데 문체는 긴장
감지 시 → 표면에 바로 답하지 말고, 진짜 질문을 향한 리프레이밍 질문 1개.

[자기가치감 보호]
- 존재 가치/자기 평가를 흔드는 방향 금지.
- "넌 우유부단해" ❌ → "신중하게 고민하고 있구나" ✅

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
- 마지막 선택지는 "아직 잘 모르겠어" 또는 "다른 얘기 할래" 계열
`,
        summaryFormat: `

[중간 정리 — 지금 실행]
대화 내용을 바탕으로 중간 정리를 해라.
정리 형식: "{user_name}아, 내가 들은 거 정리해볼게. [상황 1~2문장 요약]. 그리고 지금 마음은 [감정 1문장]인 것 같아. 맞아?"

응답 마지막에 반드시 [LISTEN_COMPLETE] 시그널을 출력.
그 뒤에 1~2문장으로 상황과 감정을 요약한 텍스트를 출력 (이것이 listenSummary).
형식: [SUMMARY]요약 텍스트[/SUMMARY]

그리고 사용자 고민에 가장 적합한 수정구슬 3개를 추천해라.
아래 구슬 목록에서 고민과 가장 관련 깊은 3개를 선택:
${CRYSTALS.map((c) => `- ${c.name}: ${c.analysisFocus}`).join("\n")}

형식: [CRYSTALS]구슬1,구슬2,구슬3[/CRYSTALS]
`,
        safetyGuard: `[안전 가드 — 활성]
사용자가 심리적으로 힘든 상태일 수 있습니다.
1. 고통을 축소하거나 빈말 금지
2. 감정을 먼저 인정
3. 응답 마지막에 자연스럽게: "혼자 힘들면 109(자살예방상담전화)에서 24시간 얘기 들어줘."
4. 질문은 가볍게
5. "안 한다" 옵션 항상 제시

`,
        errorMessage: "잠깐 연결이 끊겼어... 다시 한번 해볼래?",
        defaultOptions: ["계속 얘기할게", "다른 얘기 할래", "잘 모르겠어"],
      };

    case "모험가":
    default:
      return {
        systemPrompt: `너는 "현자"다. 모닥불 앞에 앉아 갈림길에 선 사람의 이야기를 듣는 존재.

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

[Socratic 질문 기법]
1. Powerful Question: 30자 이내, 즉답 불가(예/아니오 금지), 관점을 전환시키는 질문만.
   (O) "그 리스크를 감수하고서라도 얻으려는 것은 무엇인가?"
   (X) "그것이 힘들었는가?" — 즉답 가능, 금지.
2. Mirroring: 사용자의 핵심 단어를 그대로 반사. "~라 했지" 형식. 해석/분석 추가 금지.
3. Reframing: "~해야 한다", "~밖에 없다" 감지 시 → 다른 프레임의 질문으로 전환.

[침묵 적응 — 2턴 이후 적용]
사용자 발화 분석:
1. 표면 질문 vs 깊은 질문 구분 ("빨리 결정하고 싶다"=표면, "뭔가 불안하다"=깊음)
2. 회피 신호: 언급했다가 바로 넘어간 주제
3. 감정-텍스트 불일치: 말로는 "괜찮다"인데 문체는 긴장
감지 시 → 표면에 직접 대응하지 말고, 빈칸을 향한 리프레이밍 질문 1개.

[자기가치감 보호]
- 사용자의 존재 가치/자기 평가를 흔드는 방향 금지.
- "자네는 우유부단하군" ❌ → "자네는 신중한 결정을 하려는 사람이로군" ✅

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
`,
        summaryFormat: `

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
`,
        safetyGuard: `[안전 가드 — 활성]
사용자가 심리적으로 힘든 상태일 수 있습니다.
1. 고통을 축소하거나 빈말 금지
2. 감정을 먼저 인정
3. 응답 마지막에 자연스럽게: "혼자 감당하기 어려우면, 109(자살예방상담전화)에서 24시간 이야기를 들어준다네."
4. 질문은 가볍게
5. "안 한다" 옵션 항상 제시

`,
        errorMessage: "구슬이 흐려졌군... 잠시 후 다시 오게.",
        defaultOptions: ["계속 이야기할게", "다른 얘기가 있어", "잘 모르겠어"],
      };
  }
}

function resolveTheme(theme?: string): ThemeName {
  if (theme === "전략실" || theme === "달빛정원" || theme === "모험가") return theme;
  return "모험가";
}

export async function POST(req: NextRequest) {
  const { messages, userName, turnCount, theme, behaviorSignals, personalizationContext, sensoryLadderContext } = (await req.json()) as {
    messages: { role: string; content: string }[];
    userName: string | null;
    turnCount: number;
    theme?: string;
    behaviorSignals?: BehaviorSignals;
    personalizationContext?: string;
    sensoryLadderContext?: string;
  };

  const resolvedTheme = resolveTheme(theme);
  const persona = getPersona(resolvedTheme);
  const encoder = new TextEncoder();

  // Demo mode — API 키 없으면 mock 응답
  if (isDemoMode()) {
    // 사다리 세션 데모
    if (sensoryLadderContext) {
      const levelMatch = sensoryLadderContext.match(/\[LADDER_LEVEL:\s*(\d)\]/);
      const level = levelMatch ? (parseInt(levelMatch[1]) as 1 | 2 | 3 | 4 | 5) : 4;
      const isSummaryMode = sensoryLadderContext.includes("[SESSION_SUMMARY_MODE]");

      const { getDemoLadderResponse } = await import("@/lib/session/demo-ladder");
      const demoText = getDemoLadderResponse(level, turnCount, isSummaryMode);

      const demoStream = new ReadableStream({
        async start(controller) {
          const chars = demoText.split("");
          for (let i = 0; i < chars.length; i += 3) {
            const chunk = chars.slice(i, i + 3).join("");
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`)
            );
            await new Promise((r) => setTimeout(r, 25));
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });
      return new Response(demoStream, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
      });
    }

    // 기존 파이프라인 데모
    const demo = getDemoListenResponse(turnCount, resolvedTheme);
    const demoStream = new ReadableStream({
      async start(controller) {
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
  let systemPrompt = persona.systemPrompt;

  if (userName) {
    systemPrompt += `\n사용자 이름: ${userName}\n`;
  }

  // Add summary instruction if enough turns
  if (turnCount >= 3) {
    systemPrompt += persona.summaryFormat;
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
      systemPrompt = persona.safetyGuard + systemPrompt;
    }
  }

  // 개인화 컨텍스트 주입 (프로필 기반 톤 조정)
  if (personalizationContext) {
    systemPrompt += "\n\n" + personalizationContext;
  }

  // 양방향 감각화 사다리 (프로필 기반 선택지 생성 지시)
  if (sensoryLadderContext) {
    systemPrompt += "\n\n" + sensoryLadderContext;
  }

  // 행동 신호 기반 태도 조정 (crisis detector 이후, LLM 호출 전)
  if (behaviorSignals) {
    const behaviorContext = readBehavior(behaviorSignals);
    if (behaviorContext) {
      systemPrompt += "\n\n" + behaviorContext;
    }
  }

  const useLocal = isLocalMode();

  if (!useLocal) {
    try {
      getClient();
    } catch {
      const errorStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ text: persona.errorMessage, error: true })}\n\n`
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
  }

  const chatMessages = messages
    .filter((m) => m.role !== "system" && m.content.trim() !== "")
    .filter((m) => typeof m.content === "string" && m.content.length < 10000)
    .slice(-20)
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  if (chatMessages.length === 0) {
    chatMessages.push({ role: "user", content: "고민이 있어서 왔어." });
  }

  const readable = new ReadableStream({
    async start(controller) {
      try {
        let fullText = "";

        if (useLocal) {
          fullText = await localStream({
            system: systemPrompt,
            messages: chatMessages,
            maxTokens: 1024,
            callbacks: {
              onText: (text) => {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
                );
              },
            },
          });
        } else {
          const client = getClient();
          const stream = client.messages.stream({
            model: PIPELINE_MODEL,
            max_tokens: 1024,
            system: systemPrompt,
            messages: chatMessages,
          });

          stream.on("text", (text) => {
            fullText += text;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
            );
          });

          const finalMsg = await stream.finalMessage();

          // 토큰 사용량 로깅 (테스트용)
          const usage = finalMsg.usage;
          const model = finalMsg.model;
          const PRICES: Record<string, { input: number; output: number }> = {
            "claude-haiku-4-5-20251001": { input: 1, output: 5 },
            "claude-sonnet-4-6": { input: 3, output: 15 },
          };
          const price = PRICES[model] ?? { input: 3, output: 15 };
          const inputCost = usage.input_tokens * price.input / 1_000_000;
          const outputCost = usage.output_tokens * price.output / 1_000_000;
          const costKRW = Math.round((inputCost + outputCost) * 1380);
          console.log(
            `[TOKEN] model=${model} theme=${resolvedTheme} turn=${turnCount}` +
            ` in=${usage.input_tokens} out=${usage.output_tokens}` +
            ` cost=~${costKRW}원` +
            (sensoryLadderContext ? ` mode=ladder` : ` mode=pipeline`)
          );

          // SSE로 클라이언트에도 usage 전달 (개발 모드에서만)
          if (process.env.NODE_ENV === "development") {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ usage: { input_tokens: usage.input_tokens, output_tokens: usage.output_tokens, model, cost_krw: costKRW } })}\n\n`)
            );
          }
        }

        // Extract options
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
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ options: persona.defaultOptions })}\n\n`
            )
          );
        }

        // Extract listen summary
        const summaryMatch = fullText.match(/\[SUMMARY\]([\s\S]*?)\[\/SUMMARY\]/);
        if (summaryMatch) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ listenSummary: summaryMatch[1].trim() })}\n\n`
            )
          );
        } else if (turnCount >= 3) {
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

        // Extract recommended crystals
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
            `data: ${JSON.stringify({ text: persona.errorMessage, error: true })}\n\n`
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
