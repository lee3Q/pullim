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
