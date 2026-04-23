// "풀다"의 13가지 뜻 × 테마 매핑.
// 철학 북극성: "풀리는 세계 — 풀다의 사전 뜻 13개가 전부 풀림의 기능"
//
// 각 테마가 어떤 뜻을 강하게 가져가는지 명시해서 프롬프트에 주입.
// LLM이 해당 테마 안에서 무엇을 "풀어주는" 것이 주인지 분명해짐.

export type ThemeKey = "모험가" | "달빛정원" | "전략실" | "천문대" | "종말";

/**
 * 풀다 13가지 뜻 (국립국어원 표준국어대사전 기반).
 * 각 뜻의 ID와 한국어 레이블.
 */
export const POOL_MEANINGS = {
  M1: "얽힌 것을 풀다 (매듭, 생각)",
  M2: "싸거나 묶인 것을 풀다 (짐, 포장)",
  M3: "피로·긴장을 풀다",
  M4: "감정·분위기를 풀다 (긴장감, 화)",
  M5: "문제·일을 풀다 (숙제, 의문)",
  M6: "말을 풀다 (이야기를 시작하다)",
  M7: "금지·제약을 풀다 (통제를 없애다)",
  M8: "힘을 풀다 (힘을 빼다, 느슨하게)",
  M9: "어려움·어색함을 풀다 (관계)",
  M10: "모인 것을 흩다 (진을 풀다)",
  M11: "꿈을 풀다 (해몽)",
  M12: "재료를 풀다 (달걀, 꿀)",
  M13: "추위·몸을 풀다 (산후 회복, 몸풀기)",
} as const;

/**
 * 테마별 중심 의미 (메인 1~2개 + 보조)
 */
export const THEME_POOL_PROFILE: Record<
  ThemeKey,
  { main: (keyof typeof POOL_MEANINGS)[]; supporting: (keyof typeof POOL_MEANINGS)[]; tagline: string }
> = {
  모험가: {
    main: ["M5", "M9"],
    supporting: ["M6", "M1"],
    tagline: "얽힌 길을 풀고, 갈림길의 어색함을 풀어준다.",
  },
  달빛정원: {
    main: ["M4", "M3"],
    supporting: ["M1", "M13"],
    tagline: "감정을 풀고, 긴장을 풀어준다.",
  },
  전략실: {
    main: ["M5", "M1"],
    supporting: ["M2", "M6"],
    tagline: "문제를 풀고, 얽힌 생각을 풀어준다.",
  },
  천문대: {
    main: ["M6", "M11"],
    supporting: ["M5", "M4"],
    tagline: "말을 풀고, 꿈을 풀어준다.",
  },
  종말: {
    main: ["M7", "M8"],
    supporting: ["M4", "M3"],
    tagline: "제약을 풀고, 힘을 풀어준다 — 극한에서.",
  },
};

/**
 * 테마별 [POOL_MEANING_CONTEXT] 프롬프트 블록.
 * listen 응답에 주입해서 LLM이 "이 테마 안에서 무엇을 풀어주는 중인지" 명확히 인식.
 */
export function buildPoolMeaningContext(theme: ThemeKey): string {
  const profile = THEME_POOL_PROFILE[theme];
  if (!profile) return "";

  const mainLabels = profile.main.map((k) => POOL_MEANINGS[k]);
  const supportingLabels = profile.supporting.map((k) => POOL_MEANINGS[k]);

  return [
    "[POOL_MEANING_CONTEXT]",
    `이 테마(${theme})에서 풀림이 주로 "풀어주는" 것:`,
    ...mainLabels.map((l) => `- 중심: ${l}`),
    ...supportingLabels.map((l) => `- 보조: ${l}`),
    "",
    `한 줄 요약: ${profile.tagline}`,
    "",
    "실천 규칙:",
    "- 중심 의미에서 벗어나지 마라. 사용자가 다른 방향을 원하면 테마 전환 제안.",
    "- \"풀다\"의 결을 유지하는 언어를 섞어라 (풀어볼래, 풀리는, 풀어봐).",
    "- 단, 반복/강요는 금지. 결만 유지하고 말은 자연스럽게.",
    "[/POOL_MEANING_CONTEXT]",
  ].join("\n");
}
