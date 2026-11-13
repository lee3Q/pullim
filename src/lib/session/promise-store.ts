import type { PullimPromise } from "./ladder-types";

const STORAGE_KEY = "pullim_promises";

function validPromise(value: unknown): value is PullimPromise {
  if (!value || typeof value !== "object") return false;
  const p = value as Partial<PullimPromise>;
  return typeof p.id === "string" && !!p.id.trim() &&
    typeof p.createdAt === "number" && Number.isFinite(p.createdAt) &&
    typeof p.sessionTheme === "string" && typeof p.trigger === "string" &&
    typeof p.action === "string" &&
    ["active", "completed", "failed", "skipped"].includes(p.status ?? "") &&
    (p.checkedAt === undefined || (typeof p.checkedAt === "number" && Number.isFinite(p.checkedAt))) &&
    (p.reflection === undefined || typeof p.reflection === "string");
}

function load(): PullimPromise[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || !parsed.every(validPromise) ||
      new Set(parsed.map(p => p.id)).size !== parsed.length) {
    throw new Error("기존 약속 기록을 읽지 못했습니다.");
  }
  return parsed;
}

function save(promises: PullimPromise[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(promises));
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
  const promises = load();
  if (!promises.some(p => p.id === id)) throw new Error("약속 기록을 찾지 못했습니다.");
  const updated = promises.map((p) =>
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
