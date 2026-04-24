import type { PullimPromise } from "./ladder-types";

const STORAGE_KEY = "pullim_promises";

function load(): PullimPromise[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PullimPromise[]) : [];
  } catch {
    return [];
  }
}

function save(promises: PullimPromise[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(promises));
  } catch {}
}

export function createPromise(
  trigger: string,
  action: string,
  theme: string
): PullimPromise {
  const promise: PullimPromise = {
    id: `promise_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
    sessionTheme: theme,
    trigger,
    action,
    status: "active",
  };
  save([...load(), promise]);
  return promise;
}

export function getActivePromises(): PullimPromise[] {
  return load().filter((p) => p.status === "active");
}

export function checkPromise(
  id: string,
  status: PullimPromise["status"],
  reflection?: string
): void {
  const updated = load().map((p) =>
    p.id === id
      ? {
          ...p,
          status,
          checkedAt: Date.now(),
          ...(reflection ? { reflection } : {}),
        }
      : p
  );
  save(updated);
}

export function getPromiseHistory(): PullimPromise[] {
  return load();
}

/**
 * 최근 확인된 약속(지킴/못지킴) → 다음 세션 시스템 프롬프트 블록으로 변환.
 *
 * 철학 근거:
 * - "풀림이 기억하고 있어" — 약속을 잊지 않고 이어서 이야기
 * - 지킨 약속 = 강한 축하, 못 지킨 약속 = 자책 대신 관찰 데이터로 재프레임
 * - 24시간 이내 확인된 것만 포함 (너무 오래된 것은 현재 세션에 강제 연결 안 함)
 */
export function buildPromiseContext(): string {
  if (typeof window === "undefined") return "";
  const items = load();
  if (items.length === 0) return "";

  const now = Date.now();
  const WINDOW_MS = 24 * 60 * 60 * 1000;
  const recentChecked = items
    .filter(
      (p) =>
        (p.status === "completed" || p.status === "failed") &&
        p.checkedAt &&
        now - p.checkedAt < WINDOW_MS,
    )
    .slice(-2); // 최근 2개만

  if (recentChecked.length === 0) return "";

  const lines: string[] = ["[PROMISE_CONTEXT]"];
  for (const p of recentChecked) {
    if (p.status === "completed") {
      lines.push(
        `- 사용자가 최근에 약속을 지켰다: "${p.trigger}" → "${p.action}"`,
        `  → 이번 세션에서 강한 긍정으로 반영. "그거 했다며, 어땠어?" 같이 자연스럽게.`,
        `  → 단, 너무 과한 칭찬은 금지. 사용자가 부담 느낄 수 있다.`,
      );
    } else if (p.status === "failed") {
      lines.push(
        `- 사용자가 최근 약속을 못 지켰다: "${p.trigger}" → "${p.action}"`,
        `  → 절대 "왜 안 했어"로 묻지 마라. 자책 유발 금지.`,
        `  → "안 되는 날도 있잖아" 톤으로 흘려보내거나, "뭐가 막혔을 것 같아?" 로 관찰.`,
      );
    }
  }
  lines.push("[/PROMISE_CONTEXT]");
  return lines.join("\n");
}
