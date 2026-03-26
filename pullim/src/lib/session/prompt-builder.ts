// 레벨별 시스템 프롬프트 빌더
// 기존 PersonaConfig의 톤 규칙을 유지하면서 사다리 레벨 지시를 추가

import type { LadderLevel, EntryMode } from "./ladder-types";

const SOCRATIC_TECHNIQUES = {
  analysis: ["극단화", "타인시점", "사후가정법", "제거법", "시나리오몰입"],
  comparison: ["코인플립", "가치경매", "선택지인격화", "타임머신", "빠른직관질문"],
} as const;

/**
 * 레벨별 응답 포맷 지시 생성
 */
export function buildLevelPrompt(level: LadderLevel, entryMode: EntryMode): string {
  const lines: string[] = [`[LADDER_LEVEL: ${level}]`];

  switch (level) {
    case 5: // 직접 말하기
      lines.push(
        "사용자가 자유롭게 말하고 있다. 채팅 형태로 응답하라.",
        "Socratic 질문 기법 사용: Powerful Question, Mirroring, Reframing.",
        "선택지를 제시하지 마라. 질문 1개로 끝내라.",
        "단, 하단에 사용자가 원하면 선택지로 전환할 수 있다.",
        "",
        "응답 형식:",
        "- 2~3문장 텍스트 + 질문 1개",
        "- [OPTIONS] 블록 없음",
      );
      break;

    case 4: // 선택지 + 추천
      lines.push(
        "맥락에 맞는 선택지 3~4개를 생성하라.",
        "하나에 [추천] 표시. 마지막은 반드시 '모르겠어' 계열.",
        "선택지는 이모지 + 짧은 텍스트. 텍스트 게임처럼 가볍게.",
        "",
        "응답 형식:",
        "- 1~2문장 맥락 설명",
        "- [OPTIONS]",
        "- 이모지 선택지텍스트 [추천] (하나만)",
        "- ...",
        "- 🤷 모르겠어",
        "- [/OPTIONS]",
        "- [CHEAT]다 별로야[/CHEAT]",
      );
      break;

    case 3: // 분석 제안
      lines.push(
        `다음 기법 중 하나를 사용하여 분석을 제시하라: ${SOCRATIC_TECHNIQUES.analysis.join(", ")}`,
        '"이렇게 보이는데 맞아?" 형태로 분석 카드를 제시.',
        "",
        "응답 형식:",
        "- [ANALYSIS]",
        "- technique: 사용한기법명",
        "- content: 분석 내용 (2~3문장)",
        "- [/ANALYSIS]",
        "- [OPTIONS]",
        "- 👍 맞아",
        "- 🤔 아닌데",
        "- 🤷 모르겠어",
        "- [/OPTIONS]",
        "- [CHEAT]다 별로야[/CHEAT]",
      );
      break;

    case 2: // 감각 변형
      lines.push(
        `다음 기법 중 하나를 사용하여 두 가지 대비를 제시하라: ${SOCRATIC_TECHNIQUES.comparison.join(", ")}`,
        '"이쪽이 더 끌려?" 형태로 두 가지 감각적 대비 제시.',
        "",
        "응답 형식:",
        "- [COMPARISON]",
        "- A_emoji: 이모지",
        "- A_title: 짧은 제목",
        "- A_desc: 1문장 설명",
        "- B_emoji: 이모지",
        "- B_title: 짧은 제목",
        "- B_desc: 1문장 설명",
        "- [/COMPARISON]",
        "- [OPTIONS]",
        "- 둘 다 아닌데",
        "- [/OPTIONS]",
        "- [CHEAT]다 별로야[/CHEAT]",
      );
      break;

    case 1: // 감각
      lines.push(
        '"이거 좋아?" 수준의 단순한 감각 질문.',
        "이모지 + 짧은 라벨로 3~4개 감각 카드 제시.",
        "말 못하는 사람도 탭만으로 진행 가능해야 한다.",
        "",
        "응답 형식:",
        "- 1문장 질문 (가볍게)",
        "- [SENSORY]",
        "- 이모지|라벨",
        "- 이모지|라벨",
        "- 이모지|라벨",
        "- [/SENSORY]",
        "- [CHEAT]다 별로야[/CHEAT]",
      );
      break;
  }

  // 진입 모드별 방향
  if (entryMode === "bored") {
    lines.push("", "진입 상태: 심심. 철학/심리학 이야기를 들려주며 가치관을 수집하라.");
  } else if (entryMode === "curious") {
    lines.push("", "진입 상태: 궁금. 자기 분석 방향으로 패턴을 보여주며 진행하라.");
  }

  lines.push(`[/LADDER_LEVEL]`);
  return lines.join("\n");
}

/**
 * 세션 종료 감지 지시
 */
export function buildEndDetectionPrompt(): string {
  return [
    "[SESSION_END_DETECTION]",
    "사용자가 구체적 행동/해결책을 언급하면 (Level 4~5에서 '~해야겠다', '~할래' 등):",
    "- [WRAP_SUGGEST]정리해볼까?[/WRAP_SUGGEST] 시그널을 응답 끝에 추가.",
    "- 감각 레벨(1~2)에서는 절대 종료를 유도하지 마라.",
    "- 사용자가 직접 종료하지 않는 한 세션을 끝내지 마라.",
    "[/SESSION_END_DETECTION]",
  ].join("\n");
}
