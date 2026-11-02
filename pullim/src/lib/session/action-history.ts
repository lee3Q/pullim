/** Minimal, device-local ultimate actions. No concern text or model transcript. */
export interface ActionRecord {
  sessionId: string;
  action: string;
  deadline: string | null;
  createdAt: string;
  status: "pending" | "completed" | "deferred";
}

export interface ActionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const ACTION_HISTORY_KEY = "pullim_action_history_v1";

function isDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function validate(record: ActionRecord): void {
  if (!record || typeof record.sessionId !== "string" || !record.sessionId.trim() ||
      typeof record.action !== "string" || !record.action.trim() ||
      (record.deadline !== null && !isDate(record.deadline)) ||
      typeof record.createdAt !== "string" || !Number.isFinite(Date.parse(record.createdAt)) ||
      !["pending", "completed", "deferred"].includes(record.status)) {
    throw new Error("행동 기록 형식을 확인해 주세요. 기존 기록은 변경하지 않았습니다.");
  }
}

export function loadActions(storage: ActionStorage): ActionRecord[] {
  const raw = storage.getItem(ACTION_HISTORY_KEY);
  if (raw === null) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error("기존 행동 기록을 읽지 못했습니다.");
  const ids = new Set<string>();
  for (const record of parsed) {
    validate(record);
    if (ids.has(record.sessionId)) throw new Error("중복된 기존 행동 기록을 확인해 주세요.");
    ids.add(record.sessionId);
  }
  return parsed;
}

function minimal(record: ActionRecord): ActionRecord {
  return { sessionId: record.sessionId, action: record.action, deadline: record.deadline,
    createdAt: record.createdAt, status: record.status };
}

/** Idempotent retries preserve the first action, even if a retry changes the clock. */
export function saveAction(storage: ActionStorage, record: ActionRecord): ActionRecord {
  validate(record);
  const records = loadActions(storage);
  const existing = records.find((item) => item.sessionId === record.sessionId);
  if (existing) {
    if (existing.action !== record.action || existing.deadline !== record.deadline) {
      throw new Error("이미 저장된 행동이 있습니다. 내 기록에서 확인해 주세요.");
    }
    return existing;
  }
  const saved = minimal(record);
  storage.setItem(ACTION_HISTORY_KEY, JSON.stringify([...records.map(minimal), saved]));
  return saved;
}

export function updateAction(storage: ActionStorage, sessionId: string,
  status: ActionRecord["status"]): void {
  const records = loadActions(storage);
  const existing = records.find((record) => record.sessionId === sessionId);
  if (!existing) throw new Error("행동 기록을 찾지 못했습니다.");
  validate({ ...existing, status });
  storage.setItem(ACTION_HISTORY_KEY, JSON.stringify(records.map((record) =>
    minimal(record.sessionId === sessionId ? { ...record, status } : record))));
}

/** Deletion touches only this ultimate action, never Ladder promises or other keys. */
export function deleteAction(storage: ActionStorage, sessionId: string): void {
  const records = loadActions(storage);
  storage.setItem(ACTION_HISTORY_KEY, JSON.stringify(records
    .filter((record) => record.sessionId !== sessionId).map(minimal)));
}
