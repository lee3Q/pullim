// 양방향 사다리 타입 시스템

export type LadderLevel = 1 | 2 | 3 | 4 | 5;

export type EntryMode = "concern" | "bored" | "curious";

export type LevelName = "sensory" | "comparison" | "analysis" | "choices" | "freetext";

export const LEVEL_MAP: Record<LadderLevel, LevelName> = {
  1: "sensory",
  2: "comparison",
  3: "analysis",
  4: "choices",
  5: "freetext",
};

export const LEVEL_LABELS: Record<LadderLevel, string> = {
  1: "감각",
  2: "감각 변형",
  3: "분석 제안",
  4: "선택지",
  5: "직접 말하기",
};

// 세션 메시지 (레벨 정보 포함)
export interface LadderMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  level: LadderLevel;
  timestamp: number;
  // 레벨별 추가 데이터
  options?: LadderOption[];
  analysisCard?: AnalysisCard;
  comparisonCards?: [ComparisonCard, ComparisonCard];
  sensoryCards?: SensoryCard[];
}

// Level 4: 선택지
export interface LadderOption {
  id: string;
  emoji: string;
  text: string;
  isRecommended: boolean;
  isCheat?: boolean; // 치트 선택지 ("다 별로야")
  isFallback?: boolean; // "모르겠어"
}

// Level 3: 분석 카드
export interface AnalysisCard {
  analysis: string; // "이렇게 보이는데 맞아?"
  technique: string; // 사용된 기법명 (극단화, 타인시점 등)
}

// Level 2: 대비 카드
export interface ComparisonCard {
  emoji: string;
  title: string;
  description: string;
}

// Level 1: 감각 카드
export interface SensoryCard {
  id: string;
  emoji: string;
  label: string;
  isCheat?: boolean; // "다 별로야"
}

// 치트 후 분기 액션
export type CheatAction = "regenerate" | "theme_suggest" | "fold";

// 테마 전환 제안 정보
export interface ThemeSuggestion {
  targetTheme: "모험가" | "전략실" | "달빛정원" | "천문대" | "종말";
  reason: string;
}

// 이면 사고 이벤트
export interface BehindEvent {
  type: "cheat" | "level_change" | "recommendation_reject" | "recommendation_accept" | "timeout";
  level: LadderLevel;
  timestamp: number;
  detail?: string;
}

// 세션 상태
export interface LadderSessionState {
  sessionId: string;
  theme: "모험가" | "전략실" | "달빛정원" | "천문대" | "종말";
  entryMode: EntryMode;
  currentLevel: LadderLevel;
  messages: LadderMessage[];
  turnCount: number;
  behindEvents: BehindEvent[];
  cheatCount: number; // 누적 치트 횟수
  isEnded: boolean;
  summary: string | null;
}
