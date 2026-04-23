// 내면사고 피드백 저장소
// 철학개선.md (2026-03-31): "틀려도 고집하지 않는다 — 그게 사고의 재료"
// 사용자가 AI의 내면사고를 교정한 이력. 빈도가 성격.

export type FeedbackKind =
  | "misread_me"         // 나를 잘못 파악했어
  | "wrong_info"         // 잘못된 정보를 말하고 있어
  | "custom"             // 직접 입력
  | "confirm";           // 맞아

export interface BehindFeedback {
  id: string;
  createdAt: number;
  sessionId: string;
  inferenceSnapshot: string; // describeBehindInference 결과
  kind: FeedbackKind;
  note?: string;             // kind === "custom" 시 사용자 입력
}

const STORAGE_KEY = "pullim_behind_feedback";
const MAX_ENTRIES = 200;

function load(): BehindFeedback[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BehindFeedback[]) : [];
  } catch {
    return [];
  }
}

function save(items: BehindFeedback[]): void {
  if (typeof window === "undefined") return;
  try {
    // 상한 초과 시 오래된 항목부터 제거
    const trimmed = items.length > MAX_ENTRIES ? items.slice(-MAX_ENTRIES) : items;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // quota exceeded 등 무시
  }
}

export function recordBehindFeedback(input: Omit<BehindFeedback, "id" | "createdAt">): BehindFeedback {
  const entry: BehindFeedback = {
    ...input,
    id: `bf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
  };
  save([...load(), entry]);
  return entry;
}

export function getBehindFeedbacks(): BehindFeedback[] {
  return load();
}

/**
 * 최근 피드백 중 "misread_me" 비율. 시스템 프롬프트에 반영 가능.
 * 0.5 이상이면 "AI가 자주 틀린다 → 더 조심스럽게" 신호.
 */
export function getRecentMisreadRate(windowSize: number = 10): number {
  const recent = load().slice(-windowSize);
  if (recent.length === 0) return 0;
  const misreadCount = recent.filter((f) => f.kind === "misread_me" || f.kind === "wrong_info").length;
  return misreadCount / recent.length;
}
