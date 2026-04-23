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

/**
 * 피드백 이력 → 시스템 프롬프트 블록.
 *
 * 철학 근거:
 * - 원칙 #3 "틀려도 고집하지 않는다 — 그게 사고의 재료"의 폐회로 완성.
 * - 저장만 하고 쓰지 않으면 "사고의 재료"가 아니라 죽은 데이터다.
 * - misread 비율이 높으면 AI 톤을 더 조심스럽게 조정.
 * - 최근 사용자 교정 원문(custom)이 있으면 직접 주입.
 */
export function buildFeedbackContext(): string {
  const items = load();
  if (items.length === 0) return "";

  const recent = items.slice(-10);
  const misreadRate = getRecentMisreadRate(10);

  // 사용자 직접 입력 교정 (최근 3개)
  const customNotes = items
    .filter((f) => f.kind === "custom" && f.note && f.note.trim().length > 0)
    .slice(-3)
    .map((f) => f.note!.trim());

  const lines: string[] = ["[USER_FEEDBACK_HISTORY]"];

  if (misreadRate >= 0.5) {
    lines.push(
      "- 주의: 최근 사용자가 AI 파악을 자주 교정했다.",
      "- 추측하지 말고 물어봐라. 확정조로 말하지 마라.",
      "- \"~한 것 같다\" 보다 \"~인지 궁금해\" 톤으로.",
    );
  } else if (misreadRate >= 0.3) {
    lines.push(
      "- 최근 파악이 몇 번 빗나갔다. 한 번 더 확인하며 나아가라.",
    );
  } else if (recent.length >= 3 && misreadRate < 0.2) {
    lines.push(
      "- 최근 파악이 대체로 맞았다. 너무 머뭇거리지 말고 자연스럽게.",
    );
  }

  if (customNotes.length > 0) {
    lines.push("- 사용자가 직접 말한 교정:");
    for (const note of customNotes) {
      lines.push(`  · "${note.slice(0, 160)}"`);
    }
    lines.push("- 위 교정을 무시하지 마라. 행동으로 반영.");
  }

  if (lines.length === 1) return "";
  lines.push("[/USER_FEEDBACK_HISTORY]");
  return lines.join("\n");
}
