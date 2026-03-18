export type ModelType = "A" | "B" | "C" | "D" | "E" | "F";

export type StageName =
  | "CLARIFY"
  | "CONTEXT"
  | "OPTIONS"
  | "EVALUATE"
  | "STRESS_TEST"
  | "DECIDE"
  | "COMMIT";

export type StageStatus = "pending" | "active" | "completed" | "skipped";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

export interface Stage {
  name: StageName;
  status: StageStatus;
  messages: Message[];
  output: Record<string, unknown> | null;
}

export interface RoutingScores {
  reversibility: number; // 0-1, 높을수록 되돌리기 어려움
  info_sufficiency: number; // 0-1, 높을수록 정보 부족
  emotional_involvement: number; // 0-1, 높을수록 감정 개입
  time_pressure: number; // 0-1, 높을수록 시간 압박
}

export interface DecisionRecord {
  problem: string;
  context: string;
  options: { name: string; description: string; pros: string[]; cons: string[] }[];
  evaluation: { criteria: string[]; scores: Record<string, number[]> } | null;
  risks: string[];
  decision: string;
  rationale: string;
  first_action: string;
  review_date: string;
  share_id: string;
}

export interface Session {
  id: string;
  user_id: string;
  input_text: string;
  model_type: ModelType | null;
  routing_scores: RoutingScores | null;
  routing_explanation: string;
  current_stage: StageName | "ROUTING" | "COMPLETE";
  stages: Stage[];
  decision_record: DecisionRecord | null;
  created_at: string;
  completed_at: string | null;
}

export const STAGE_ORDER: StageName[] = [
  "CLARIFY",
  "CONTEXT",
  "OPTIONS",
  "EVALUATE",
  "STRESS_TEST",
  "DECIDE",
  "COMMIT",
];

export const STAGE_LABELS: Record<StageName, string> = {
  CLARIFY: "문제 명확화",
  CONTEXT: "맥락 파악",
  OPTIONS: "선택지 탐색",
  EVALUATE: "기준 평가",
  STRESS_TEST: "스트레스 테스트",
  DECIDE: "결정",
  COMMIT: "실행 계약",
};

export const MODEL_LABELS: Record<ModelType, string> = {
  A: "여러 관점에서 따져보기",
  B: "빠른 결정",
  C: "탐색하며 알아가기",
  D: "감정 정리 + 분석",
  E: "우선순위 정하기",
  F: "패턴 자동화",
};

