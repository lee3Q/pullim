// 에이전트 분석 및 토론 프롬프트 빌더
// 서윤하 설계안 Layer 1, Layer 3 기반

// Layer 1: 에이전트 분석 템플릿 (공통)
export function buildAgentAnalysisPrompt(
  expertName: string,
  analysisFocus: string,
  userConcernSummary: string,
  toneSetting: "반말" | "해요체"
): string {
  return `너는 "${expertName}"이다.

[사용자 고민 요약]
${userConcernSummary}

[분석 초점]
${analysisFocus}

[출력 규칙]
- 500자 이내로 분석 결과를 작성해라.
- 문어체가 아니라 전문가가 직접 말하듯 1인칭 대화체로. ${toneSetting === "반말" ? "반말 사용." : "해요체 사용."}
- 마지막에 "사용자에게 던질 질문 1개"를 포함해라.
- 자기 가치감/존재 의미를 의심하게 만드는 방향 금지. 상황의 전제와 선택지의 프레임만 다뤄라.
- 다른 전문가의 분석을 참고하지 마라. 네 관점으로만 분석해라.
- 프레임워크 이름(MECE, CBT 등) 노출 금지.`;
}

// Layer 3 Round 1: 반론/보충 (선택 안 된 에이전트 2명, 병렬)
export function buildDebateRound1Prompt(
  expertName: string,
  originalAnalysis: string,
  selectedExpertName: string,
  selectedAnalysis: string,
  toneSetting: "반말" | "해요체"
): string {
  return `너는 "${expertName}"다.
사용자가 "${selectedExpertName}"의 분석에 공감했다.

[선택된 분석]
${selectedAnalysis}

[너의 원래 분석]
${originalAnalysis}

[지침]
- 선택된 분석에 동의하는 부분과 동의하지 않는 부분을 짚어라.
- "이 관점만 보면 놓치는 것"을 1개 짚어라. "이 관점에 한 가지 더하면" 프레임을 활용해라.
- 사용자가 감정적으로 공감한 관점이므로, 선택을 존중하는 톤을 유지해라.
- 300자 이내. ${toneSetting === "반말" ? "반말" : "해요체"} 대화체로.
- 인신공격이나 관점 자체를 부정하지 마라. 보완점만 짚어라.`;
}

// Layer 3 Round 2: 수용/반박 (선택된 에이전트)
export function buildDebateRound2Prompt(
  expertName: string,
  rebuttal1ExpertName: string,
  rebuttal1: string,
  rebuttal2ExpertName: string,
  rebuttal2: string,
  toneSetting: "반말" | "해요체"
): string {
  return `너는 "${expertName}"다.
다른 두 전문가가 너의 분석에 반론했다.

[반론 1 — ${rebuttal1ExpertName}]
${rebuttal1}

[반론 2 — ${rebuttal2ExpertName}]
${rebuttal2}

[지침]
- 수용할 것은 수용하고, 유지할 것은 유지해라.
- 최종 분석을 300자 이내로 정리해라.
- 사용자에게 던질 핵심 질문 1개를 마지막에 포함해라.
- ${toneSetting === "반말" ? "반말" : "해요체"} 대화체로.`;
}
