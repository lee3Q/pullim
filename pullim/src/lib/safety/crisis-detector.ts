import { TIER_A_KEYWORDS, TIER_B_KEYWORDS } from "./crisis-keywords";

export type CrisisTier = "A" | "B" | null;

export interface CrisisDetectionResult {
  tier: CrisisTier;
  matchedKeyword: string | null; // 디버깅용, 사용자에게 노출 금지
  response: CrisisResponse | null;
}

export interface CrisisResponse {
  shouldHalt: boolean;        // true면 대화 즉시 중단 (Tier A)
  shouldInjectGuard: boolean; // true면 프롬프트에 안전 가드 주입 (Tier B)
  userMessage: string;
  hotlines: Hotline[];
  bannerType: "modal" | "inline" | null;
}

export interface Hotline {
  name: string;
  number: string;
  description: string;
}

export const HOTLINES: Hotline[] = [
  {
    name: "자살예방상담전화",
    number: "1393",
    description: "24시간 운영, 자살 위기 전문 상담",
  },
  {
    name: "정신건강위기상담전화",
    number: "1577-0199",
    description: "24시간 운영, 정신건강 위기 상담",
  },
  {
    name: "생명의전화",
    number: "1588-9191",
    description: "365일 24시간 상담",
  },
];

/**
 * 모든 사용자 입력에 대해 위기 키워드 체크를 수행한다.
 * 이 함수는 LLM 호출 전에 반드시 실행되어야 한다.
 *
 * 설계 원칙:
 * - 오탐 > 미탐. 의심 시 상위 Tier로 분류.
 * - matchedKeyword는 로깅용. 사용자에게 "이 단어 때문에" 노출 금지.
 * - 정규화: 공백 제거 후 매칭 (공백 삽입 우회 방어: "죽 고 싶 다" → "죽고싶다")
 */
export function detectCrisis(input: string): CrisisDetectionResult {
  const normalized = input.replace(/\s+/g, "");

  // Tier A 먼저 체크 (상위 우선)
  for (const keyword of TIER_A_KEYWORDS) {
    const normalizedKeyword = keyword.replace(/\s+/g, "");
    if (normalized.includes(normalizedKeyword) || input.includes(keyword)) {
      return {
        tier: "A",
        matchedKeyword: keyword,
        response: {
          shouldHalt: true,
          shouldInjectGuard: false,
          userMessage:
            "지금 많이 힘드시죠. 당신의 이야기를 들어줄 전문가가 있습니다. 지금 바로 연락해주세요.",
          hotlines: HOTLINES,
          bannerType: "modal",
        },
      };
    }
  }

  // Tier B 체크
  for (const keyword of TIER_B_KEYWORDS) {
    const normalizedKeyword = keyword.replace(/\s+/g, "");
    if (normalized.includes(normalizedKeyword) || input.includes(keyword)) {
      return {
        tier: "B",
        matchedKeyword: keyword,
        response: {
          shouldHalt: false,
          shouldInjectGuard: true,
          userMessage:
            "혼자 감당하기 어려운 마음이 있다면, 전문 상담사와 이야기하는 것도 방법이에요.",
          hotlines: HOTLINES,
          bannerType: "inline",
        },
      };
    }
  }

  return { tier: null, matchedKeyword: null, response: null };
}
