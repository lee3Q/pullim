// 추천 선택지 결정 엔진
// 추천은 관찰 도구: 맞추려는 게 아니라, 틀림이 데이터.

import type { ProbabilityProfile } from "./probability-profile";

export interface ChoiceRecord {
  turnNumber: number;
  options: string[];
  recommendedIndex: number;
  chosenIndex: number;      // -1 = 직접 입력
  responseTimeMs: number;
  isMatch: boolean;
  timestamp: string;
}

/**
 * 세션 내 추천 불일치 기록을 프로필에 반영
 * 불일치 = weight 1.5, 일치 = weight 1.0
 */
export function computeSessionAcceptRate(records: ChoiceRecord[]): number {
  if (records.length === 0) return 0.5;
  const matches = records.filter((r) => r.isMatch).length;
  return matches / records.length;
}

/**
 * 추천 인덱스 결정 (간단 버전)
 * 프로필의 주요 차원을 보고 가장 가능성 높은 선택지를 추천
 *
 * 현재는 "첫 번째 선택지를 기본 추천"으로 시작,
 * 프로필 데이터 쌓이면 점차 정교해짐
 */
export function getRecommendedIndex(
  options: string[],
  _profile: ProbabilityProfile | null
): number {
  // MVP: 첫 번째 옵션을 추천 (데이터 부족 시)
  // TODO: 프로필 차원 매칭으로 정교화
  if (options.length === 0) return 0;
  return 0;
}
