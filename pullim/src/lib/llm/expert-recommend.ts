/**
 * expert-recommend.ts
 * concern_type → 추천 전문가 3명 매핑
 *
 * 화이트리스트 기준 (서영 승인조건 #4 반영):
 * - "정신과 의사" → "마음건강 전문가" (승인조건 #1)
 * - "의사 (내과/가정의학)" → "생활건강 전문가" (권고 D)
 * - | string 직접 입력 차단 (v2.1 이후 개방)
 */

export const EXPERT_WHITELIST = [
  "심리상담가",
  "마음건강 전문가",
  "경영 컨설턴트",
  "변호사",
  "재무 전문가",
  "진로 코치",
  "철학자",
  "행동경제학자",
  "관계 상담사",
  "생활건강 전문가",
] as const;

export type ExpertName = (typeof EXPERT_WHITELIST)[number];

/**
 * concern_type별 기본 추천 전문가 3명
 * 라우팅 결과에서 프론트가 없을 때 fallback으로 사용
 */
export const EXPERT_RECOMMEND_MAP: Record<string, [ExpertName, ExpertName, ExpertName]> = {
  career: ["진로 코치", "경영 컨설턴트", "행동경제학자"],
  relationship: ["관계 상담사", "심리상담가", "철학자"],
  identity: ["심리상담가", "철학자", "행동경제학자"],
  burnout: ["마음건강 전문가", "심리상담가", "생활건강 전문가"],
  health: ["생활건강 전문가", "마음건강 전문가", "심리상담가"],
  finance: ["재무 전문가", "경영 컨설턴트", "행동경제학자"],
  legal: ["변호사", "경영 컨설턴트", "심리상담가"],
  academic: ["진로 코치", "행동경제학자", "심리상담가"],
  general: ["심리상담가", "경영 컨설턴트", "철학자"],
};

/**
 * concern_type을 받아서 추천 전문가 3명을 반환한다.
 * 알 수 없는 concern_type은 general로 fallback.
 */
export function getRecommendedExperts(concernType: string): [ExpertName, ExpertName, ExpertName] {
  return EXPERT_RECOMMEND_MAP[concernType] ?? EXPERT_RECOMMEND_MAP["general"];
}

/**
 * 전문가 이름이 화이트리스트에 속하는지 검증.
 * 직접 입력 전문가 가드레일 (서영 승인조건 #4).
 */
export function isValidExpert(name: string): name is ExpertName {
  return (EXPERT_WHITELIST as readonly string[]).includes(name);
}
