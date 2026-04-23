// 프로필 localStorage 안전 업데이트 헬퍼
// LadderSession 등 여러 곳에서 동일 키/구조를 반복 사용하지 않도록 중앙화.

import type { ProbabilityProfile } from "./probability-profile";

const KEY = "pullim_user_profile";

interface StoredData {
  profile: ProbabilityProfile;
  sessionCount: number;
  lastSessionAt: string;
  lastSatisfaction: number | null;
  completedSessions: number;
}

export function updateStoredProfile(
  updater: (p: ProbabilityProfile) => ProbabilityProfile,
): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const data = JSON.parse(raw) as Partial<StoredData>;
    if (!data?.profile) return;
    data.profile = updater(data.profile);
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // 무시 — 저장 실패 시 다음 기회에
  }
}

export function readStoredProfile(): ProbabilityProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<StoredData>;
    return data?.profile ?? null;
  } catch {
    return null;
  }
}
