// 끝판왕 타입 시스템

export type CrystalName =
  | "금화" | "나침반" | "거울" | "저울" | "모닥불"
  | "타인" | "심연" | "전략" | "뒤집기" | "몸";

export type ModelProvider = "claude" | "gpt" | "gemini" | "local";

export type CharacterName = "현자" | "비서" | "코치" | "친구";

export type ThemeName = "모험가" | "전략실" | "달빛정원";

export type ConcernType =
  | "career" | "relationship" | "identity" | "burnout"
  | "health" | "finance" | "legal" | "academic" | "general";

export type CrisisLevel = "GREEN" | "YELLOW" | "RED";

export type StageName =
  | "ENTER"
  | "LISTEN"
  | "RESEARCH"
  | "VERIFY"
  | "DISCUSS_1"
  | "CRYSTAL_SELECT"
  | "CRYSTAL_ANALYZE"
  | "DISCUSS_2"
  | "DEBATE"
  | "DISCUSS_3"
  | "JUDGE"
  | "CONCLUDE"
  | "COMPLETE";

// 사용자에게 보이는 5단계 (내부 11단계를 압축)
export type DisplayStage = "입장" | "듣기" | "리서치" | "구슬" | "결론";

export const STAGE_TO_DISPLAY: Record<StageName, DisplayStage> = {
  ENTER: "입장",
  LISTEN: "듣기",
  RESEARCH: "리서치",
  VERIFY: "리서치",
  DISCUSS_1: "리서치",
  CRYSTAL_SELECT: "구슬",
  CRYSTAL_ANALYZE: "구슬",
  DISCUSS_2: "구슬",
  DEBATE: "구슬",
  DISCUSS_3: "구슬",
  JUDGE: "구슬",
  CONCLUDE: "결론",
  COMPLETE: "결론",
};

export interface RoutingScores {
  reversibility: number;
  info_sufficiency: number;
  emotional_involvement: number;
  time_pressure: number;
}

// 구슬 정의
export interface CrystalDef {
  name: CrystalName;
  icon: string;
  label: string;
  description: string;
  analysisFocus: string;
  expertLabel: string;      // 전략실용 전문가 이름
  expertDescription: string; // 전략실용 설명
}

export const CRYSTALS: CrystalDef[] = [
  { name: "금화", icon: "💰", label: "금화의 구슬", description: "돈의 흐름이 보입니다", analysisFocus: "재무 분석 (비용, 수익, 기회비용)", expertLabel: "재무 전문가", expertDescription: "현금흐름, 기회비용을 수치화합니다" },
  { name: "나침반", icon: "🧭", label: "나침반의 구슬", description: "3년 뒤의 갈림길이 보입니다", analysisFocus: "진로/커리어 분석 (강점×시장, 분기점)", expertLabel: "진로 코치", expertDescription: "커리어 경로와 분기점을 구조화합니다" },
  { name: "거울", icon: "🪞", label: "거울의 구슬", description: "왜 망설이는지 보입니다", analysisFocus: "행동경제학 (인지 편향, 손실 회피, 현상유지)", expertLabel: "행동경제학자", expertDescription: "의사결정 왜곡 패턴을 진단합니다" },
  { name: "저울", icon: "⚖️", label: "저울의 구슬", description: "권리와 의무가 보입니다", analysisFocus: "법적/구조적 분석", expertLabel: "변호사", expertDescription: "권리, 책임, 법적 리스크를 따집니다" },
  { name: "모닥불", icon: "🔥", label: "모닥불의 구슬", description: "가슴이 뛰는 쪽이 보입니다", analysisFocus: "가치관/동기 분석 (내적 동기, 에너지)", expertLabel: "심리상담가", expertDescription: "표면 감정 뒤의 진짜 감정을 살펴봅니다" },
  { name: "타인", icon: "🎯", label: "타인의 구슬", description: "상대방의 눈으로 보입니다", analysisFocus: "관계 분석 (상대 입장, 역학)", expertLabel: "관계 상담사", expertDescription: "상대방 시점과 관계 역학을 분석합니다" },
  { name: "심연", icon: "🧠", label: "심연의 구슬", description: "감정 아래 숨은 패턴이 보입니다", analysisFocus: "심리 패턴 (반복되는 선택, 회피 패턴)", expertLabel: "마음건강 전문가", expertDescription: "번아웃, 불안, 회복 방향을 살펴봅니다" },
  { name: "전략", icon: "📊", label: "전략의 구슬", description: "판의 구조가 보입니다", analysisFocus: "경영/전략 분석 (리스크, 포지셔닝)", expertLabel: "경영 컨설턴트", expertDescription: "선택지, 리스크, 기회비용을 구조화합니다" },
  { name: "뒤집기", icon: "🤔", label: "뒤집기의 구슬", description: "질문 자체가 바뀝니다", analysisFocus: "철학적 리프레이밍 (전제 의심)", expertLabel: "철학자", expertDescription: "전제를 의심하고 프레임을 깹니다" },
  { name: "몸", icon: "🏃", label: "몸의 구슬", description: "몸이 보내는 신호가 보입니다", analysisFocus: "생활/건강 연결 (스트레스, 수면, 에너지)", expertLabel: "생활건강 전문가", expertDescription: "신체 상태가 결정에 미치는 영향을 봅니다" },
];

// 리서치
export interface DataCard {
  title: string;
  fact: string;
  source: { name: string; url: string };
  confidence: "high" | "medium" | "low";
}

export interface ResearchOutput {
  cards: DataCard[];
  conflicts: { topic: string; source_a: string; source_b: string }[];
  gaps: string[];
  searchMode: "full" | "basic" | "skip";
  totalSources: number;
}

// 구슬 분석
export interface CrystalAnalysis {
  crystal: CrystalName;
  model: ModelProvider;
  observation: string;
  insight: string;
  risk: string;
  question: string;
  latencyMs: number;
}

export interface Disagreement {
  topic: string;
  positions: {
    crystal: CrystalName;
    model: ModelProvider;
    stance: string;
  }[];
  severity: "minor" | "major" | "critical";
  userImplication: string;
}

// 토론
export interface DebateRound {
  round: 1 | 2;
  crystal: CrystalName;
  model: ModelProvider;
  content: string;
}

// 결론
export interface ConclusionData {
  situationSummary: string;
  options: { direction: string; risk: string; reward: string }[];
  keyCrossroad: string;
  userTendency: string;
}

export interface ActionCommitment {
  action: string;
  deadline: string;
  nextSessionDate: string;
}

// 세션
// 구슬 잔액 (점진적 소모 모델)
export interface CrystalBalance {
  weeklyLimit: number;      // 유료 50, 무료 10
  weeklyUsed: number;
  weekResetAt: string;      // ISO date
  sessionUsed: number;      // 현재 세션에서 소모한 구슬
}

export interface UltimateSession {
  id: string;
  userId: string | null;
  character: CharacterName;
  theme: ThemeName;
  currentStage: StageName;
  concernType: ConcernType | null;
  routingScores: RoutingScores | null;

  recommendedCrystals: CrystalName[];
  selectedCrystals: CrystalName[];
  crystalModelMap: Partial<Record<CrystalName, ModelProvider>>;

  research: ResearchOutput | null;
  crystalAnalyses: CrystalAnalysis[];
  disagreements: Disagreement[];
  debateRounds: DebateRound[];

  conclusion: ConclusionData | null;
  actionCommitment: ActionCommitment | null;

  crisisLevel: CrisisLevel;
  listenSummary: string | null;
  userName: string | null;
  crystalsUsed: number;     // 이 세션에서 소모한 구슬
  createdAt: string;
  completedAt: string | null;
}

export interface UltimateMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  options?: string[];
}
