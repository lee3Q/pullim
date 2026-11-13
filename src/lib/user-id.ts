// 익명 사용자 식별 — localStorage 기반 랜덤 ID (외부 의존성 제로)

const STORAGE_KEY = "pullim_user_id";

function createAnonymousId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 21);
  }
  return `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

export function getUserId(): string {
  if (typeof window === "undefined") return "";

  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = createAnonymousId();
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    // No durable identity is available; do not invent one for profile requests.
    return "";
  }
}
