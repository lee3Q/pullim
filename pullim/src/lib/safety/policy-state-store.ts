import { createHmac } from "node:crypto";

export type PolicyState = {
  sessionId: string;
  version: number;
  stage: "check_in" | "define_problem" | "research" | "values" | "provisional_decision" | "next_action";
  riskState: "open" | "awaiting_confirmation" | "emergency";
  consent: "unknown" | "granted" | "declined";
  choiceHashes: string[];
  events: { type: string; value: string }[];
};

export class StalePolicyState extends Error {}
export class PolicyStoreUnavailable extends Error {}

const memory = globalThis as typeof globalThis & { __pullimPolicyStates?: Map<string, string> };
const localStates = memory.__pullimPolicyStates ??= new Map<string, string>();
const emergencyMemory = globalThis as typeof globalThis & { __pullimEmergencySessions?: Set<string> };
const localEmergency = emergencyMemory.__pullimEmergencySessions ??= new Set<string>();
const ttlSeconds = 86400;

function keyFor(sessionId: string): string {
  const secret = process.env.PULLIM_POLICY_SECRET || "pullim-local-development-only";
  return `pullim:policy:${createHmac("sha256", secret).update(sessionId).digest("hex")}`;
}
const emergencyKeyFor = (sessionId: string): string => `${keyFor(sessionId)}:emergency`;

function redisConfig(): { url: string; token: string } | null {
  const url = process.env.PULLIM_POLICY_REDIS_URL;
  const token = process.env.PULLIM_POLICY_REDIS_TOKEN;
  if (!url || !token) return null;
  if (!/^https:\/\//.test(url)) throw new PolicyStoreUnavailable("policy Redis URL must use HTTPS");
  return { url: url.replace(/\/$/, ""), token };
}

async function redisCommand(args: (string | number)[]): Promise<unknown> {
  const config = redisConfig();
  if (!config) throw new PolicyStoreUnavailable("durable policy store is not configured");
  try {
    const response = await fetch(config.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(args),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const value = await response.json() as { result?: unknown; error?: string };
    if (value.error) throw new Error(value.error);
    return value.result;
  } catch {
    throw new PolicyStoreUnavailable("policy store request failed");
  }
}

function valid(value: unknown, sessionId: string): value is PolicyState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<PolicyState>;
  return state.sessionId === sessionId && Number.isSafeInteger(state.version) && (state.version ?? -1) > 0
    && ["check_in", "define_problem", "research", "values", "provisional_decision", "next_action"].includes(state.stage ?? "")
    && ["open", "awaiting_confirmation", "emergency"].includes(state.riskState ?? "")
    && ["unknown", "granted", "declined"].includes(state.consent ?? "")
    && Array.isArray(state.choiceHashes) && state.choiceHashes.every((item) => typeof item === "string" && /^[0-9a-f]{64}$/.test(item))
    && Array.isArray(state.events) && state.events.every((item) => item && typeof item.type === "string" && typeof item.value === "string");
}

export async function loadPolicyState(sessionId: string): Promise<PolicyState | null> {
  const key = keyFor(sessionId);
  const raw = process.env.NODE_ENV === "production"
    ? await redisCommand(["GET", key])
    : localStates.get(key) ?? null;
  if (raw === null || raw === undefined) return null;
  try {
    const value = JSON.parse(String(raw));
    if (valid(value, sessionId)) {
      const marked = process.env.NODE_ENV === "production"
        ? await redisCommand(["GET", emergencyKeyFor(sessionId)]) !== null
        : localEmergency.has(key);
      if (marked) value.riskState = "emergency";
      return value;
    }
  } catch { /* fail closed below */ }
  throw new PolicyStoreUnavailable("stored policy state is invalid");
}

export async function markPolicyEmergency(sessionId: string): Promise<void> {
  const key = keyFor(sessionId);
  if (process.env.NODE_ENV === "production") {
    const result = await redisCommand(["SET", emergencyKeyFor(sessionId), "1", "EX", ttlSeconds]);
    if (result !== "OK") throw new PolicyStoreUnavailable("could not preserve emergency state");
  } else localEmergency.add(key);
}

const compareAndSet = `
if redis.call('GET', KEYS[2]) then
  local ok, proposed = pcall(cjson.decode, ARGV[2])
  if not ok or proposed.riskState ~= 'emergency' then return -2 end
end
local old = redis.call('GET', KEYS[1])
local version = 0
if old then
  local ok, decoded = pcall(cjson.decode, old)
  if not ok or type(decoded) ~= 'table' or type(decoded.version) ~= 'number' then return -1 end
  version = decoded.version
end
if version ~= tonumber(ARGV[1]) then return 0 end
redis.call('SET', KEYS[1], ARGV[2], 'EX', tonumber(ARGV[3]))
return 1
`;

export async function commitPolicyState(state: PolicyState): Promise<void> {
  const key = keyFor(state.sessionId);
  const expected = state.version;
  const next = { ...state, version: expected + 1 };
  const serialized = JSON.stringify(next);
  if (process.env.NODE_ENV === "production") {
    const result = await redisCommand(["EVAL", compareAndSet, 2, key, emergencyKeyFor(state.sessionId), expected, serialized, ttlSeconds]);
    if (result === 0 || result === -2) throw new StalePolicyState("policy state changed or risk escalated during request");
    if (result !== 1) throw new PolicyStoreUnavailable("policy store compare-and-set failed");
  } else {
    if (localEmergency.has(key) && state.riskState !== "emergency") throw new StalePolicyState("risk escalated during request");
    const raw = localStates.get(key);
    const current = raw ? JSON.parse(raw) as PolicyState : null;
    if ((current?.version ?? 0) !== expected) throw new StalePolicyState("policy state changed during request");
    localStates.set(key, serialized);
  }
  state.version = next.version;
}
