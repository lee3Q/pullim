import { NextRequest, NextResponse } from "next/server";
import { getClient, ANALYSIS_MODEL } from "@/lib/llm/claude";
import { buildDebateRound1Prompt, buildDebateRound2Prompt } from "@/lib/llm/agent-prompts";
import { detectCrisis } from "@/lib/safety/crisis-detector";
import { ExpertAnalysis, DebateRound } from "@/lib/types-v2";

interface DebateRequest {
  analyses: ExpertAnalysis[];
  selectedExpertName: string;
  toneSetting: "반말" | "해요체";
  listenSummary: string;
}

interface DebateResponse {
  round1: DebateRound[];
  round2: DebateRound;
  debateSynthesis: string;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as DebateRequest;
  const { analyses, selectedExpertName, toneSetting, listenSummary } = body;

  if (!analyses || analyses.length < 3 || !selectedExpertName || !listenSummary) {
    return NextResponse.json(
      { error: "analyses(3개), selectedExpertName, listenSummary 필수" },
      { status: 400 }
    );
  }

  // 안전 레이어: listenSummary 위기 감지
  const crisisResult = detectCrisis(listenSummary);
  if (crisisResult.tier === "A" || crisisResult.tier === "B") {
    return NextResponse.json(
      {
        crisis: true,
        tier: crisisResult.tier,
        debateBlocked: true,
        message: crisisResult.response!.userMessage,
        hotlines: crisisResult.response!.hotlines,
      },
      { status: 200 }
    );
  }

  let client;
  try {
    client = getClient();
  } catch (error) {
    console.error("Claude client init error:", error);
    return NextResponse.json(
      { error: "AI 서비스에 일시적인 문제가 있습니다." },
      { status: 500 }
    );
  }

  try {
    // 선택된 전문가 분석
    const selectedAnalysis = analyses.find(
      (a) => a.expert_name === selectedExpertName
    );
    if (!selectedAnalysis) {
      return NextResponse.json(
        { error: "selectedExpertName이 analyses에 없습니다." },
        { status: 400 }
      );
    }

    // 선택 안 된 2명
    const otherAnalyses = analyses.filter(
      (a) => a.expert_name !== selectedExpertName
    );
    if (otherAnalyses.length < 2) {
      return NextResponse.json(
        { error: "반론할 전문가가 2명 필요합니다." },
        { status: 400 }
      );
    }

    // 라운드 1: 선택 안 된 2명 반론 (병렬)
    const round1Promises = otherAnalyses.slice(0, 2).map(async (expert) => {
      const prompt = buildDebateRound1Prompt(
        expert.expert_name,
        expert.analysis,
        selectedExpertName,
        selectedAnalysis.analysis,
        toneSetting
      );

      const response = await client.messages.create({
        model: ANALYSIS_MODEL,
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      });

      const content =
        response.content[0].type === "text" ? response.content[0].text : "";

      const round: DebateRound = {
        round: 1,
        expert_name: expert.expert_name,
        content: content.trim(),
      };
      return round;
    });

    const round1Results: DebateRound[] = await Promise.all(round1Promises);

    // 라운드 2: 선택된 전문가 수용/반박 (순차)
    const round2Prompt = buildDebateRound2Prompt(
      selectedExpertName,
      round1Results[0].expert_name,
      round1Results[0].content,
      round1Results[1].expert_name,
      round1Results[1].content,
      toneSetting
    );

    const round2Response = await client.messages.create({
      model: ANALYSIS_MODEL,
      max_tokens: 500,
      messages: [{ role: "user", content: round2Prompt }],
    });

    const round2Content =
      round2Response.content[0].type === "text"
        ? round2Response.content[0].text
        : "";

    const round2: DebateRound = {
      round: 2,
      expert_name: selectedExpertName,
      content: round2Content.trim(),
    };

    // 토론 종합 요약 생성
    const synthesisPrompt = `아래 토론 내용을 사용자 관점에서 2~3문장으로 종합해라.
합의된 부분과 남은 쟁점을 구분해서 정리해라.
프레임워크 이름 없이, 따뜻한 톤으로.

[라운드 1 반론]
${round1Results.map((r) => `${r.expert_name}: ${r.content}`).join("\n\n")}

[라운드 2 최종]
${selectedExpertName}: ${round2.content}`;

    const synthesisResponse = await client.messages.create({
      model: ANALYSIS_MODEL,
      max_tokens: 300,
      messages: [{ role: "user", content: synthesisPrompt }],
    });

    const debateSynthesis =
      synthesisResponse.content[0].type === "text"
        ? synthesisResponse.content[0].text.trim()
        : "";

    const responseBody: DebateResponse = {
      round1: round1Results,
      round2,
      debateSynthesis,
    };

    return NextResponse.json(responseBody);
  } catch (error) {
    console.error("Debate error:", error);
    return NextResponse.json(
      { error: "토론 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
