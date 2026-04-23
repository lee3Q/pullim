// 명예의 전당 — 사용자의 깊은 통찰 아카이브
// 철학개선.md (2026-03-30): "자신의 삶을 관통하는 통찰은 자신만 낼 수 있다"
// = "풀림과의 추억", "잊고 싶지 않은 순간"

export interface Insight {
  id: string;
  createdAt: number;
  sessionId: string;
  theme: string;
  content: string;       // 사용자 원문
  level: number;         // 어느 레벨에서 나왔는지
  context?: string;      // 직전 AI 질문 (맥락)
  starred?: boolean;     // 사용자가 별표로 강조
}

const STORAGE_KEY = "pullim_insight_archive";
const MAX_ENTRIES = 100;

function load(): Insight[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Insight[]) : [];
  } catch {
    return [];
  }
}

function save(items: Insight[]): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = items.length > MAX_ENTRIES ? items.slice(-MAX_ENTRIES) : items;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // quota 무시
  }
}

export function archiveInsight(input: Omit<Insight, "id" | "createdAt">): Insight {
  const entry: Insight = {
    ...input,
    id: `ins_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
  };
  save([...load(), entry]);
  return entry;
}

export function listInsights(): Insight[] {
  return load().sort((a, b) => b.createdAt - a.createdAt);
}

export function toggleStar(id: string): Insight[] {
  const updated = load().map((i) => (i.id === id ? { ...i, starred: !i.starred } : i));
  save(updated);
  return updated;
}

export function removeInsight(id: string): Insight[] {
  const updated = load().filter((i) => i.id !== id);
  save(updated);
  return updated;
}

/**
 * 사용자 텍스트가 "깊은 통찰" 후보인지 판별.
 *
 * 철학 근거:
 * - "빈도 제한 — 진짜 의미 있는 순간에만. 잦으면 가치 하락." (철학개선.md)
 * - 단순 길이 아닌, 자기반성/통찰 언어 존재 + 충분한 길이 + 감정 언어
 *
 * 보수적으로 판단 (false-positive 억제).
 */
export function isInsightCandidate(content: string): boolean {
  const trimmed = content.trim();
  if (trimmed.length < 40 || trimmed.length > 400) return false;

  // 자기 반성 / 통찰 언어
  const insightMarkers = [
    "내가", "나는", "사실은", "처음", "알게", "깨달", "느꼈",
    "보니까", "생각해보니", "돌이켜보면", "지금 보면",
    "어쩌면", "아마도", "그랬던 것 같",
    "그게 문제", "그게 핵심", "그게 진짜",
    "이제야", "마침내", "정말로",
  ];
  const hasInsightMarker = insightMarkers.some((m) => trimmed.includes(m));
  if (!hasInsightMarker) return false;

  // 단순 질문/선택지 응답 배제
  if (/^[👍🤔🤷✨💭🎯📝🔍🤝🌱🌙⚡]/.test(trimmed)) return false;
  if (/^(맞아|아닌데|모르겠어|둘 다 아닌데)$/.test(trimmed)) return false;

  return true;
}

/**
 * 최근 보관 제안 빈도. 빈도 제한용.
 */
export function getRecentSuggestionCount(windowMs: number = 24 * 60 * 60 * 1000): number {
  const now = Date.now();
  return load().filter((i) => now - i.createdAt < windowMs).length;
}
