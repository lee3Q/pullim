// 적응형 파악 게임 로직 + 확률 프로필 생성
// 기본 5개, 일관성 낮으면 추가 질문 (최대 8개).
// 부족한 데이터로 태도를 결정하지 않는다.

import {
  ProbabilityProfile,
  createEmptyProfile,
  updateDimension,
  createEmptyDimension,
  type DimensionKey,
} from "./probability-profile";

// 축 매핑
type Axis = "approach" | "risk" | "coping" | "decision";

const AXIS_TO_DIMENSION: Record<Axis, DimensionKey> = {
  approach: "approachStyle",
  risk: "riskTolerance",
  coping: "copingStyle",
  decision: "decisionSpeed",
};

interface ChoiceOption {
  emoji: string;
  label: string;
  axis: Axis;
  value: "a" | "b"; // a = analytical/cautious/problem_solving/deliberate(-1), b = 반대(+1)
}

export interface DiscoveryQuestion {
  id: number;
  prompt: string;
  options: [ChoiceOption, ChoiceOption];
}

// 모험가 테마 기본 5개 (질문 1,5가 같은 축 "risk" → 일관성 측정)
export const ADVENTURE_QUESTIONS: DiscoveryQuestion[] = [
  {
    id: 1,
    prompt: "두 갈래 길이 보인다. 어디로?",
    options: [
      { emoji: "🌲", label: "숲 속 오솔길", axis: "risk", value: "a" },
      { emoji: "🌋", label: "연기 나는 산길", axis: "risk", value: "b" },
    ],
  },
  {
    id: 2,
    prompt: "보물상자를 발견했다. 어떻게?",
    options: [
      { emoji: "🔑", label: "열쇠를 찾아본다", axis: "approach", value: "a" },
      { emoji: "💪", label: "그냥 연다", axis: "approach", value: "b" },
    ],
  },
  {
    id: 3,
    prompt: "동료가 다쳤다. 어떻게?",
    options: [
      { emoji: "🏥", label: "약초를 찾으러 간다", axis: "coping", value: "a" },
      { emoji: "🤝", label: "옆에 앉아서 기다린다", axis: "coping", value: "b" },
    ],
  },
  {
    id: 4,
    prompt: "마왕이 제안한다. '한 가지 소원을 들어주지.'",
    options: [
      { emoji: "💭", label: "\"생각할 시간을 줘\"", axis: "decision", value: "a" },
      { emoji: "⚡", label: "즉시 대답한다", axis: "decision", value: "b" },
    ],
  },
  {
    id: 5,
    prompt: "절벽 끝에 보물이 보인다. 밧줄은 낡아 보인다.",
    options: [
      { emoji: "🔍", label: "다른 길을 찾아본다", axis: "risk", value: "a" },
      { emoji: "🧗", label: "밧줄을 잡고 내려간다", axis: "risk", value: "b" },
    ],
  },
];

// 추가 질문 풀 (적응형: 일관성 낮을 때 사용)
export const EXTRA_QUESTIONS: DiscoveryQuestion[] = [
  {
    id: 6,
    prompt: "지도가 없다. 어떻게 하지?",
    options: [
      { emoji: "🧭", label: "별을 보고 방향을 잡는다", axis: "approach", value: "a" },
      { emoji: "🚶", label: "일단 걸어본다", axis: "approach", value: "b" },
    ],
  },
  {
    id: 7,
    prompt: "동료가 의견이 다르다. 어떻게?",
    options: [
      { emoji: "🤔", label: "한번 들어본다", axis: "coping", value: "b" },
      { emoji: "📋", label: "내 근거를 정리한다", axis: "coping", value: "a" },
    ],
  },
  {
    id: 8,
    prompt: "마을에 도착했다. 하룻밤 묵을까?",
    options: [
      { emoji: "🏠", label: "쉬었다 가자", axis: "decision", value: "a" },
      { emoji: "🌙", label: "밤길이라도 계속 간다", axis: "decision", value: "b" },
    ],
  },
];

export interface SelectionRecord {
  questionId: number;
  selectedValue: "a" | "b";
  axis: Axis;
  timeMs: number;
}

const FAST_THRESHOLD_MS = 5000;
const HESITATION_THRESHOLD_MS = 15000;

/**
 * 일관성 계산 (같은 축 2회+ 측정의 일치율)
 */
export function computeConsistency(selections: SelectionRecord[]): number {
  const byAxis: Record<string, string[]> = {};
  for (const s of selections) {
    if (!byAxis[s.axis]) byAxis[s.axis] = [];
    byAxis[s.axis].push(s.selectedValue);
  }
  let matchCount = 0;
  let pairCount = 0;
  for (const values of Object.values(byAxis)) {
    if (values.length < 2) continue;
    for (let i = 0; i < values.length - 1; i++) {
      for (let j = i + 1; j < values.length; j++) {
        pairCount++;
        if (values[i] === values[j]) matchCount++;
      }
    }
  }
  return pairCount === 0 ? 1 : matchCount / pairCount;
}

/**
 * 확신도 계산 (빠른 선택 비율)
 */
export function computeConfidence(selections: SelectionRecord[]): number {
  if (selections.length === 0) return 0;
  const fastCount = selections.filter((s) => s.timeMs <= FAST_THRESHOLD_MS).length;
  return fastCount / selections.length;
}

/**
 * 적응형: 추가 질문이 필요한지 판단
 */
export function shouldAskMore(selections: SelectionRecord[]): boolean {
  const consistency = computeConsistency(selections);
  const confidence = computeConfidence(selections);

  // 일관성 낮고 확신도 낮으면 → 파악 부족
  if (consistency < 0.5 && confidence < 0.3) return true;
  // 일관성 낮지만 확신도 높으면 → 충동적, 확인 1개 더
  if (consistency < 0.5 && confidence >= 0.3) return true;

  return false;
}

/**
 * 다음에 물어볼 추가 질문 가져오기
 */
export function getNextExtraQuestion(
  answeredIds: number[]
): DiscoveryQuestion | null {
  return EXTRA_QUESTIONS.find((q) => !answeredIds.includes(q.id)) || null;
}

/**
 * 선택 기록에서 확률 프로필 생성
 */
export function buildProbabilityProfile(
  selections: SelectionRecord[],
  userName: string = "",
  speechStyle: "casual" | "formal" = "casual",
  selectedTheme: "adventure" | "garden" | "strategy" | "stargazer" = "adventure"
): ProbabilityProfile {
  const profile = createEmptyProfile();
  profile.userName = userName;
  profile.speechStyle = speechStyle;
  profile.selectedTheme = selectedTheme;
  profile.totalSessions = 1;

  // 각 선택을 차원에 반영
  for (const s of selections) {
    const dimKey = AXIS_TO_DIMENSION[s.axis];
    const signal = s.selectedValue === "a" ? -1 : 1;
    profile[dimKey] = updateDimension(profile[dimKey], signal);
    profile.totalObservations++;
  }

  // 행동 기반 메타 지표
  const times = selections.map((s) => s.timeMs);
  profile.avgResponseTimeMs = times.length > 0
    ? times.reduce((a, b) => a + b, 0) / times.length
    : 0;

  // 일관성 + 확신도 → selfAwareness
  const consistency = computeConsistency(selections);
  const confidence = computeConfidence(selections);

  // selfAwareness: consistency 높고 confidence 적당하면 높음
  const saValue = (consistency - 0.5) * 2; // 0~1 → -1~1
  const confAdjust = confidence >= 0.3 ? 0.2 : -0.2;
  profile.selfAwareness = {
    value: Math.max(-1, Math.min(1, saValue + confAdjust)),
    observations: selections.length,
    lastUpdated: new Date().toISOString(),
  };

  return profile;
}

// ═══════════════════════════════════════════
// 스토리형 파악 (story-scenes.ts 기반)
// ═══════════════════════════════════════════

import type { StoryChoice, ThemeType, Signal } from "./story-scenes";

export interface StorySelectionRecord {
  sceneId: string;
  choiceIndex: number;
  signals: Signal[];
  wasRecommended: boolean;
  timeMs: number;
}

/**
 * 스토리 선택 기록에서 확률 프로필 생성
 */
export function buildProfileFromStory(
  records: StorySelectionRecord[],
  userName: string = "",
  speechStyle: "casual" | "formal" = "casual",
  selectedTheme: ThemeType = "garden"
): ProbabilityProfile {
  const profile = createEmptyProfile();
  profile.userName = userName;
  profile.speechStyle = speechStyle;
  profile.selectedTheme = selectedTheme;
  profile.totalSessions = 1;

  for (const record of records) {
    for (const signal of record.signals) {
      const dimKey = AXIS_TO_DIMENSION[signal.axis];
      // 추천 불일치 = 새로운 면 (weight 1.5)
      const weight = record.wasRecommended ? 1 : 1.5;
      profile[dimKey] = updateDimension(profile[dimKey], signal.value, weight);
      profile.totalObservations++;
    }
  }

  // 행동 기반 메타 지표
  const times = records.map((r) => r.timeMs);
  profile.avgResponseTimeMs = times.length > 0
    ? times.reduce((a, b) => a + b, 0) / times.length
    : 0;

  // 추천 수락률
  const acceptedCount = records.filter((r) => r.wasRecommended).length;
  profile.recommendationAcceptRate = records.length > 0
    ? acceptedCount / records.length
    : 0.5;

  // 일관성 + 확신도 → selfAwareness
  const consistency = computeStoryConsistency(records);
  const confidence = computeStoryConfidence(records);
  const saValue = (consistency - 0.5) * 2;
  const confAdjust = confidence >= 0.3 ? 0.2 : -0.2;
  profile.selfAwareness = {
    value: Math.max(-1, Math.min(1, saValue + confAdjust)),
    observations: records.length,
    lastUpdated: new Date().toISOString(),
  };

  return profile;
}

/**
 * 스토리 선택의 축별 일관성 (같은 축 선택의 부호 일치율)
 */
function computeStoryConsistency(records: StorySelectionRecord[]): number {
  const byAxis: Record<string, number[]> = {};
  for (const r of records) {
    for (const s of r.signals) {
      if (!byAxis[s.axis]) byAxis[s.axis] = [];
      byAxis[s.axis].push(s.value);
    }
  }
  let matchCount = 0;
  let pairCount = 0;
  for (const values of Object.values(byAxis)) {
    if (values.length < 2) continue;
    for (let i = 0; i < values.length - 1; i++) {
      for (let j = i + 1; j < values.length; j++) {
        pairCount++;
        if (Math.sign(values[i]) === Math.sign(values[j])) matchCount++;
      }
    }
  }
  return pairCount === 0 ? 1 : matchCount / pairCount;
}

/**
 * 스토리 선택의 확신도 (빠른 선택 비율)
 */
function computeStoryConfidence(records: StorySelectionRecord[]): number {
  if (records.length === 0) return 0;
  const fastCount = records.filter((r) => r.timeMs <= 5000).length;
  return fastCount / records.length;
}

// 기존 호환: 이전 UserProfile 타입 (deprecated, 점진적 마이그레이션용)
export interface UserProfile {
  approachStyle: "analytical" | "intuitive";
  riskTolerance: "cautious" | "adventurous";
  copingStyle: "problem_solving" | "empathy";
  decisionSpeed: "deliberate" | "spontaneous";
  avgSelectionTime: number;
  hesitationPoints: number[];
  confidence: number;
  consistency: number;
  selfAwareness: "high" | "low";
}

/**
 * 기존 호환: ProbabilityProfile → 이전 UserProfile 변환
 * 기존 코드가 UserProfile을 참조하는 곳에서 점진적으로 제거
 */
export function toLegacyProfile(p: ProbabilityProfile): UserProfile {
  return {
    approachStyle: p.approachStyle.value <= 0 ? "analytical" : "intuitive",
    riskTolerance: p.riskTolerance.value <= 0 ? "cautious" : "adventurous",
    copingStyle: p.copingStyle.value <= 0 ? "problem_solving" : "empathy",
    decisionSpeed: p.decisionSpeed.value <= 0 ? "deliberate" : "spontaneous",
    avgSelectionTime: p.avgResponseTimeMs,
    hesitationPoints: [],
    confidence: p.recommendationAcceptRate,
    consistency: Math.max(0, (p.selfAwareness.value + 1) / 2),
    selfAwareness: p.selfAwareness.value > 0 ? "high" : "low",
  };
}

// 기존 호환: buildProfile (기존 DiscoveryGame에서 호출)
export function buildProfile(selections: SelectionRecord[]): UserProfile {
  const prob = buildProbabilityProfile(selections);
  return toLegacyProfile(prob);
}
