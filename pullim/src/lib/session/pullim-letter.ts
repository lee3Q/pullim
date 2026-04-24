// 풀림의 편지 — 누적 관찰을 주기적으로 정리해 사용자에게 보내는 서사.
//
// 철학 근거:
// - 홀딩 환경 강화 + 유대 + 성장 가시화
// - 절대 금지 "오래 안 오셨네요"와 구분:
//   이 편지는 "자주 왔든 안 왔든" 누적된 관찰을 얘기할 뿐 이탈 언급 없음
// - 북극성 확장본 "풀렸다가, 모이는 세계"의 "모이는" 쪽 극단
//
// 생성 조건 (모두 만족):
// - 최소 3회 이상 약속 이행/실패 기록 또는 5개 이상 통찰 아카이브
// - 마지막 편지 발송 후 7일 이상 경과

import { getPromiseHistory } from "./promise-store";
import { listInsights } from "./insight-archive";
import { getBehindFeedbacks } from "./behind-feedback-store";

const LETTER_STATE_KEY = "pullim_letter_state";
const LETTER_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7일

export interface LetterSnapshot {
  generatedAt: number;
  body: string;
  stats: {
    totalInsights: number;
    totalPromises: number;
    completedPromises: number;
    totalFeedbacks: number;
    confirmRate: number;
  };
}

interface StoredLetterState {
  lastSentAt: number | null;
  lastSnapshot: LetterSnapshot | null;
}

function loadState(): StoredLetterState {
  if (typeof window === "undefined") return { lastSentAt: null, lastSnapshot: null };
  try {
    const raw = localStorage.getItem(LETTER_STATE_KEY);
    if (!raw) return { lastSentAt: null, lastSnapshot: null };
    return JSON.parse(raw) as StoredLetterState;
  } catch {
    return { lastSentAt: null, lastSnapshot: null };
  }
}

function saveState(s: StoredLetterState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LETTER_STATE_KEY, JSON.stringify(s));
  } catch {
    // 무시
  }
}

/**
 * 새 편지가 생성 가능한 상태인지.
 */
export function canGenerateLetter(now: number = Date.now()): boolean {
  const { lastSentAt } = loadState();
  if (lastSentAt && now - lastSentAt < LETTER_INTERVAL_MS) return false;

  const insights = listInsights();
  const promises = getPromiseHistory();
  const checkedPromises = promises.filter((p) => p.status !== "active");

  return insights.length >= 5 || checkedPromises.length >= 3;
}

/**
 * 현재 누적 데이터로 편지 본문 작성. 로컬 규칙 기반 (LLM 호출 없음).
 *
 * 의도적으로 "너"를 주어로. 1~2 단락. 금지 원칙 지킴.
 */
export function generateLetter(now: number = Date.now()): LetterSnapshot {
  const insights = listInsights();
  const promises = getPromiseHistory();
  const feedbacks = getBehindFeedbacks();

  const completedPromises = promises.filter((p) => p.status === "completed").length;
  const failedPromises = promises.filter((p) => p.status === "failed").length;
  const confirmedFeedbacks = feedbacks.filter((f) => f.kind === "confirm").length;
  const confirmRate =
    feedbacks.length > 0 ? confirmedFeedbacks / feedbacks.length : 0;

  // 가장 많은 테마
  const themeCounts = new Map<string, number>();
  for (const i of insights) {
    themeCounts.set(i.theme, (themeCounts.get(i.theme) ?? 0) + 1);
  }
  const topTheme =
    [...themeCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const fragments: string[] = [];

  // Opening — 중립적, 이탈·수치 언급 없음 (Philosophy Agent Shadow Leak #1 수정)
  fragments.push("짧은 편지.");

  // 통찰 — 구체 숫자보다 "네가 스스로 남긴 문장" 표현
  // (parroting 우회: 카운트가 아닌 네 행위의 이름 붙이기)
  if (insights.length >= 5) {
    const starred = insights.filter((i) => i.starred).length;
    if (starred > 0) {
      fragments.push("스스로 별표한 문장들이 몇 개 있어. 그 문장들은 네가 직접 골랐다는 게 의미야.");
    } else {
      fragments.push("네가 남긴 문장들이 쌓이는 중이야.");
    }
  }

  // 테마 성향 — 단정 금지, 관찰로만
  if (topTheme) {
    fragments.push(`${topTheme}으로 자주 돌아왔다는 건 그 결이 네게 맞는 것 같아. 아닐 수도 있고.`);
  }

  // 약속 — 이행 실패 표현에서 "자책 유발" 가능 어휘 제거
  if (completedPromises > 0 && failedPromises === 0) {
    fragments.push("약속한 건 지켰어. 그 자체로 하나의 관찰이야.");
  } else if (completedPromises > failedPromises) {
    fragments.push("어떤 날은 지키고 어떤 날은 못 지켰어. 못 지킨 날도 너에 대한 단서야.");
  } else if (failedPromises > 0 && completedPromises === 0) {
    // 자책 유발 어휘 제거. "지키기 어려웠어" → "약속이 지금 너한테 맞는 도구가 아닐 수도"
    fragments.push("약속이 지금 너한테 맞는 도구가 아닐 수도. 다른 방식을 찾아봐도 돼.");
  }

  // 피드백 교정 — "AI 단정조" 완화
  if (feedbacks.length >= 5) {
    if (confirmRate >= 0.7) {
      fragments.push("내가 읽은 네 상태를 네가 자주 긍정해줬어. 근데 이것도 내가 틀릴 수 있어.");
    } else if (confirmRate < 0.3) {
      fragments.push("내가 너를 자주 잘못 읽었어. 말해줘서 고마워.");
    }
  }

  // 닫음 — "다음에 또" 는 약한 암시도 제거. 오롯이 판단 없음 천명만.
  fragments.push("이건 판단 아니야. 너는 읽고 지워도 돼.");

  const body = fragments.join(" ");

  return {
    generatedAt: now,
    body,
    stats: {
      totalInsights: insights.length,
      totalPromises: promises.length,
      completedPromises,
      totalFeedbacks: feedbacks.length,
      confirmRate,
    },
  };
}

/**
 * 편지를 실제로 "발송" (로컬 상태 갱신).
 */
export function markLetterSent(snapshot: LetterSnapshot): void {
  saveState({ lastSentAt: snapshot.generatedAt, lastSnapshot: snapshot });
}

export function getLastLetter(): LetterSnapshot | null {
  return loadState().lastSnapshot;
}
