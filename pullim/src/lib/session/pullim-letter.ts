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

  // Opening — 이탈 언급 없이 "같이 쌓아온 것" 프레임
  if (insights.length > 0 || completedPromises > 0) {
    fragments.push("지금까지 같이 풀어온 것들을 한 번 정리해봤어.");
  } else {
    fragments.push("짧은 편지 하나.");
  }

  // 통찰 카운트
  if (insights.length >= 5) {
    fragments.push(
      `전당에 ${insights.length}개의 문장이 쌓였어. 그중에도 스스로 별표한 게 ${insights.filter((i) => i.starred).length}개야.`,
    );
  }

  // 테마 성향
  if (topTheme) {
    fragments.push(`가장 자주 풀어낸 세계는 ${topTheme}이었어.`);
  }

  // 약속 이행 패턴
  if (completedPromises > 0 && failedPromises === 0) {
    fragments.push(`약속한 건 ${completedPromises}번 전부 지켰어. 쉬운 일이 아니야.`);
  } else if (completedPromises > failedPromises) {
    fragments.push(
      `약속 ${completedPromises + failedPromises}번 중 ${completedPromises}번은 지켰어. 못 지킨 날도 데이터니까 괜찮아.`,
    );
  } else if (failedPromises > 0 && completedPromises === 0) {
    fragments.push(
      `약속은 아직 지키기 어려웠어. 그 자체로 네가 뭘 진짜 원하는지 드러나는 거야. 다시 풀어볼 시점일 수도.`,
    );
  }

  // 피드백 교정 패턴 — "틀려도 고집하지 않는다" 연결
  if (feedbacks.length >= 5) {
    if (confirmRate >= 0.7) {
      fragments.push("내가 읽은 네 상태를 네가 자주 긍정해줬어. 방향이 맞는 것 같아.");
    } else if (confirmRate < 0.3) {
      fragments.push("내가 너를 자주 잘못 읽었어. 말해줘서 고마워. 더 조심스러워질게.");
    }
  }

  // 닫음 — "다음"을 열어두기
  fragments.push("이건 기록일 뿐이야. 판단 아니야. 다음에 또 풀자.");

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
