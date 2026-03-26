// 세션 내 실시간 행동 신호 → 태도 지시문 변환
// crisis-detector가 먼저 실행된 후 이 모듈이 실행된다.

export interface BehaviorSignals {
  responseTimeMs: number;
  messageLength: number;
  lengthTrend: "shorter" | "stable" | "longer";
  timeTrend: "faster" | "stable" | "slower";
  choiceHesitationMs: number;
  choiceChanges: number;
  turnCount: number;
}

interface BehaviorDirective {
  instruction: string;
  priority: number; // 높을수록 우선
}

export function readBehavior(signals: BehaviorSignals): string {
  const directives: BehaviorDirective[] = [];

  // 답변이 점점 짧아짐 (3턴 이상)
  if (signals.turnCount >= 3 && signals.lengthTrend === "shorter") {
    directives.push({
      instruction: "피로하거나 관심이 줄었다. 가볍게 전환하거나 마무리 제안.",
      priority: 3,
    });
  }

  // 선택지 앞에서 45초+ 멈춤
  if (signals.choiceHesitationMs >= 45000) {
    directives.push({
      instruction: "결정이 어렵다. 선택지를 줄이거나 더 쉽게 재구성.",
      priority: 4,
    });
  }

  // 즉답 (3초 이내)
  if (signals.responseTimeMs > 0 && signals.responseTimeMs <= 3000) {
    directives.push({
      instruction: "깊이 생각하지 않는 상태. 가볍게 진행하되 중요 지점에서 확인.",
      priority: 1,
    });
  }

  // 답변이 점점 길어짐
  if (signals.turnCount >= 3 && signals.lengthTrend === "longer") {
    directives.push({
      instruction: "마음이 열리는 중. 끊지 말고 따라가라.",
      priority: 2,
    });
  }

  // 단답 (5자 이하)
  if (signals.messageLength > 0 && signals.messageLength <= 5) {
    directives.push({
      instruction: "말하기 싫은 상태. 추궁하지 말고 선택지를 제시.",
      priority: 3,
    });
  }

  // 선택지 여러 번 변경
  if (signals.choiceChanges >= 2) {
    directives.push({
      instruction: "선택에 확신이 없다. 부담 없이 편하게 골라도 된다고 안심시켜라.",
      priority: 2,
    });
  }

  if (directives.length === 0) return "";

  // 우선순위 높은 순으로 정렬 → 최대 2개
  directives.sort((a, b) => b.priority - a.priority);
  const top = directives.slice(0, 2);

  return [
    "[BEHAVIOR_CONTEXT]",
    ...top.map((d) => `- ${d.instruction}`),
    "위 내용을 사용자에게 직접 언급하지 마라. 행동으로만 반영.",
    "[/BEHAVIOR_CONTEXT]",
  ].join("\n");
}
