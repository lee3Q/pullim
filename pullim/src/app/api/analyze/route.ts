import { NextRequest, NextResponse } from "next/server";
import { getClient, ANALYSIS_MODEL } from "@/lib/llm/claude";
import { buildAgentAnalysisPrompt } from "@/lib/llm/agent-prompts";
import { EXPERT_FOCUS_MAP } from "@/lib/llm/expert-focus";
import { detectCrisis } from "@/lib/safety/crisis-detector";
import { ExpertName, ExpertAnalysis, CrisisLevel } from "@/lib/types-v2";

interface AnalyzeRequest {
  input: string;
  selectedExperts: ExpertName[];
  listenSummary: string;
  toneSetting: "반말" | "해요체";
}

interface AnalyzeResponse {
  analyses: ExpertAnalysis[];
  safetyLevel: CrisisLevel;
}

// 단일 전문가 분석 호출
async function callExpertAnalysis(
  expertName: ExpertName,
  listenSummary: string,
  toneSetting: "반말" | "해요체"
): Promise<ExpertAnalysis> {
  const client = getClient();
  const analysisFocus = EXPERT_FOCUS_MAP[expertName];
  const prompt = buildAgentAnalysisPrompt(expertName, analysisFocus, listenSummary, toneSetting);

  const response = await client.messages.create({
    model: ANALYSIS_MODEL,
    max_tokens: 800,
    messages: [{ role: "user", content: prompt }],
  });

  const rawText = response.content[0].type === "text" ? response.content[0].text : "";

  // 마지막 줄이 질문이라고 가정 (프롬프트 지시에 따라)
  const lines = rawText.trim().split("\n").filter((l) => l.trim() !== "");
  const lastLine = lines[lines.length - 1] ?? "";
  const analysisLines = lines.slice(0, -1);

  return {
    expert_name: expertName,
    analysis: analysisLines.join("\n").trim(),
    question: lastLine.trim(),
  };
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as AnalyzeRequest;
  const { input, selectedExperts, listenSummary, toneSetting } = body;

  if (!input || !selectedExperts || selectedExperts.length === 0 || !listenSummary) {
    return NextResponse.json(
      { error: "input, selectedExperts, listenSummary 필수" },
      { status: 400 }
    );
  }

  // 안전 레이어: input 위기 감지
  const crisisResult = detectCrisis(input);

  // CrisisTier → CrisisLevel 매핑: A=RED, B=YELLOW, null=GREEN
  let safetyLevel: CrisisLevel = "GREEN";
  if (crisisResult.tier === "A") {
    safetyLevel = "RED";
  } else if (crisisResult.tier === "B") {
    safetyLevel = "YELLOW";
  }

  // Tier A(RED): 즉시 차단
  if (safetyLevel === "RED") {
    return NextResponse.json(
      {
        crisis: true,
        safetyLevel: "RED",
        message: crisisResult.response!.userMessage,
        hotlines: crisisResult.response!.hotlines,
      },
      { status: 200 }
    );
  }

  // Tier B(YELLOW): 토론 차단 플래그 포함, 분석은 계속
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
  void client; // getClient() 호출로 초기화 검증 완료

  try {
    // selectedExperts 3명 병렬 Claude 호출
    const analysisPromises = selectedExperts.map((expertName) =>
      callExpertAnalysis(expertName, listenSummary, toneSetting)
    );

    const analyses: ExpertAnalysis[] = await Promise.all(analysisPromises);

    const responseBody: AnalyzeResponse & { debateBlocked?: boolean } = {
      analyses,
      safetyLevel,
    };

    // Tier B: 토론 차단 플래그
    if (safetyLevel === "YELLOW") {
      responseBody.debateBlocked = true;
    }

    return NextResponse.json(responseBody);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "분석 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
