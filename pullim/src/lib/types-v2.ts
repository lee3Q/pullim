// v2 타입 시스템
// 서윤하 설계안 Part 3 기반 + 서영 승인조건 반영
//
// [스키마 메모 — user_id nullable, 2026-03-16]
// 결정 근거: 42차 비전재정의 회의 (한재원)
// V2Session.user_id는 string | null 로 처리한다.
// 이유: 현재 인증 방식이 익명(localStorage) 기본 → 선택적 OAuth.
//       비로그인 세션에서도 기록 생성 가능하게 열어둬야 히스토리 확장 시 마이그레이션 부담 최소화.
// DB 컬럼: user_id UUID REFERENCES auth.users(id) — nullable 허용 (NOT NULL 제약 없음)
// RLS 고려: user_id IS NULL 인 행은 익명 세션 → 본인 device 식별자(localStorage key)로만 접근 제어.
//           user_id IS NOT NULL 인 행은 Supabase Auth RLS로 본인만 접근.
// 변경 시 주의: user_id를 NOT NULL로 바꾸면 기존 익명 세션 행 전수 처리 필요. 함부로 바꾸지 말 것.

export type V2StageName = "LISTEN" | "EXPERT_SELECT" | "ANALYZE" | "DEBATE" | "LAND";

// 42차 비전재정의 회의 확정 — mode 파라미터 A방식 (엔드포인트 분리 아님)
// 같은 세계 안의 방: burnout / relationship / decision 세 모드를 단일 파이프라인에서 mode 파라미터로 분기
export type ModeName = "burnout" | "relationship" | "decision";

// 서영 승인조건 #4: string 제거, 화이트리스트 10종만
export type ExpertName =
  | "심리상담가"
  | "마음건강 전문가"
  | "경영 컨설턴트"
  | "변호사"
  | "재무 전문가"
  | "진로 코치"
  | "철학자"
  | "행동경제학자"
  | "관계 상담사"
  | "생활건강 전문가";

export type ConcernType =
  | "career"
  | "relationship"
  | "identity"
  | "burnout"
  | "health"
  | "finance"
  | "legal"
  | "academic"
  | "general";

// 서영 승인조건 #3: RED=Tier A, YELLOW=Tier B, GREEN=Clean
export type CrisisLevel = "GREEN" | "YELLOW" | "RED";

export interface ExpertAnalysis {
  expert_name: ExpertName;
  analysis: string;
  question: string;
}

export interface DebateRound {
  round: 1 | 2;
  expert_name: string;
  content: string;
}

export interface RoutingScoresV2 {
  reversibility: number;
  info_sufficiency: number;
  emotional_involvement: number;
  time_pressure: number;
}

export interface V2Session {
  id: string;
  user_id: string | null; // nullable — 익명 세션 지원 (스키마 메모 상단 참조)
  mode: ModeName | null; // 세션 시작 시 결정, 미결정 시 null → 라우팅 후 설정
  current_stage: V2StageName | "ROUTING" | "COMPLETE";
  concern_type: ConcernType | null;
  routing_scores: RoutingScoresV2 | null;
  selected_experts: ExpertName[];
  expert_analyses: ExpertAnalysis[];
  debate_rounds: DebateRound[];
  crisis_level: CrisisLevel;
  tone_setting: "반말" | "해요체";
  listen_summary: string | null;
  created_at: string;
  completed_at: string | null;
}
