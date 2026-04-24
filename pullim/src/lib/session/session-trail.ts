// 세션 트레일 — 미완 세션 복귀 위한 경량 스냅샷
// 철학 근거: 원칙 #5 "끝까지 포기하지 않는다"
// 세션이 끊겨도 맥락이 증발하지 않도록, 로컬에 최소 흔적을 남긴다.

const STORAGE_KEY = "pullim_session_trail";
const TTL_MS = 48 * 60 * 60 * 1000; // 48시간

export interface SessionTrail {
  savedAt: number;
  sessionId: string;
  theme: string;
  currentLevel: number;
  turnCount: number;
  lastUserMessage?: string;
  lastAiMessage?: string;
  completed: boolean; // 세션 요약까지 완료되었는가
}

function readRaw(): SessionTrail | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionTrail;
  } catch {
    return null;
  }
}

function writeRaw(trail: SessionTrail): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trail));
  } catch {
    // quota 무시
  }
}

/**
 * 세션 진행 중 스냅샷 저장 (매 턴 호출)
 */
export function saveTrail(input: Omit<SessionTrail, "savedAt">): void {
  writeRaw({ ...input, savedAt: Date.now() });
}

/**
 * 미완 세션 조회. TTL 초과, 빈 세션, 완료된 세션은 null 반환.
 */
export function getUnfinishedTrail(): SessionTrail | null {
  const trail = readRaw();
  if (!trail) return null;
  if (Date.now() - trail.savedAt > TTL_MS) return null;
  if (trail.completed) return null;
  if (trail.turnCount < 1) return null;
  return trail;
}

/**
 * 세션 완료 표시 — 홀딩 환경 종결.
 */
export function markTrailCompleted(): void {
  const trail = readRaw();
  if (!trail) return;
  writeRaw({ ...trail, completed: true, savedAt: Date.now() });
}

/**
 * 이어서 하기 후 기존 trail 정리.
 * 새 세션이 시작되면 이전 trail은 더 이상 "이어서"의 대상이 아님.
 */
export function consumeTrailOnResume(): void {
  const trail = readRaw();
  if (!trail) return;
  // 완료 플래그 세워서 "이어서" 카드 다시 뜨지 않도록.
  // 이후 새 세션의 saveTrail이 덮어씀.
  writeRaw({ ...trail, completed: true });
}

/**
 * 트레일 완전 삭제.
 */
export function clearTrail(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 무시
  }
}

/**
 * "어제 풀던 맥락"을 간단한 프롬프트 컨텍스트로 변환.
 * personalizationContext 뒤에 붙여서 첫 AI 응답에 맥락을 주입한다.
 */
export function trailToPromptContext(trail: SessionTrail): string {
  const when = timeAgo(Date.now() - trail.savedAt);
  const parts = [
    `[PRIOR_SESSION_CONTEXT]`,
    `사용자는 ${when} 이 테마(${trail.theme})에서 대화를 시작했다가 중단했다.`,
    `현재 레벨: ${trail.currentLevel}, 주고받은 턴 수: ${trail.turnCount}.`,
  ];
  if (trail.lastUserMessage) {
    parts.push(`사용자의 마지막 말: "${trail.lastUserMessage.slice(0, 180)}"`);
  }
  if (trail.lastAiMessage) {
    parts.push(`풀림의 마지막 말: "${trail.lastAiMessage.slice(0, 180)}"`);
  }
  parts.push(
    `이번 세션은 이어서 시작하는 것이야. "다시 시작하자"가 아니라 "이어서 해볼까"의 톤으로.`,
    `단, 사용자가 완전히 다른 주제로 넘어가면 따라가라. 강요하지 마라.`,
    `[/PRIOR_SESSION_CONTEXT]`,
  );
  return parts.join("\n");
}

function timeAgo(ms: number): string {
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${Math.max(1, mins)}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}
