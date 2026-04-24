// 피로 임계 감시 — 주간 패턴 기반 "오늘은 쉬어" 제안.
//
// 철학 근거:
// - 극한의 적응형: "피곤해? 내일 하자" (2026-03-30)
// - 절대 금지: "오래 안 오셨네요" — 반대로 "자주 왔지만 힘들어 보인다"에 반응
// - 빈도가 성격 — 자주 온 사람에게 "쉬어도 괜찮다" 신호
//
// 데이터 소스: localStorage의 behind-feedback + insight-archive + promise 결과 조합.
// 서버 의존 없음. 24h 윈도우 기반 집계.

import { getBehindFeedbacks } from "./behind-feedback-store";
import { getPromiseHistory } from "./promise-store";
import { listInsights } from "./insight-archive";

export interface FatigueWatchState {
  /** 최근 24h 세션 관련 이벤트 수 */
  recentActivityCount: number;
  /** 최근 24h 미읽음/교정(misread)/실패약속 비율 */
  negativeRate: number;
  /** 임계 초과 여부 */
  flagged: boolean;
  /** 사용자에게 보여줄 메시지 (flagged일 때만 non-null) */
  gentleMessage: string | null;
}

const WINDOW_MS = 24 * 60 * 60 * 1000;
const MIN_ACTIVITY = 3;            // 24h 안 최소 활동 수 (노이즈 억제)
const NEGATIVE_THRESHOLD = 0.5;    // 부정 비율 임계

// UX/Philosophy 감사 반영 (2026-04-23):
// - "쉬어도 돼" 류는 forced-positivity 우회 ("괜찮아질 거야"의 보호형)
// - 지시/권유 톤 제거, 관찰만. 사용자가 해석한다.
const GENTLE_MESSAGES = [
  "요즘 이 앱 자주 열었더라. 그 자체가 지금 뭔가 있다는 신호일 수 있어.",
  "지금까지 오늘 같은 날이 몇 번 있었어. 네가 알아채고 있기를.",
  "이 카드는 제안 아니고 관찰이야. 무시해도 돼.",
];

/**
 * 최근 24h 활동을 기반으로 피로 상태 판정.
 * 로컬 데이터만 사용 — SSR/프라이버시 안전.
 */
export function computeFatigueWatch(now: number = Date.now()): FatigueWatchState {
  const windowStart = now - WINDOW_MS;

  const feedbacks = getBehindFeedbacks().filter((f) => f.createdAt >= windowStart);
  const promises = getPromiseHistory().filter(
    (p) => (p.checkedAt ?? p.createdAt) >= windowStart,
  );
  const insights = listInsights().filter((i) => i.createdAt >= windowStart);

  // 활동 = 피드백 + 약속 확인 + 통찰 아카이브 전체
  const recentActivityCount = feedbacks.length + promises.length + insights.length;

  if (recentActivityCount < MIN_ACTIVITY) {
    return {
      recentActivityCount,
      negativeRate: 0,
      flagged: false,
      gentleMessage: null,
    };
  }

  // 부정 신호: misread/wrong_info/custom feedback + failed promise
  const negatives =
    feedbacks.filter((f) => f.kind !== "confirm").length +
    promises.filter((p) => p.status === "failed").length;

  const negativeRate = negatives / recentActivityCount;
  const flagged = negativeRate >= NEGATIVE_THRESHOLD;

  return {
    recentActivityCount,
    negativeRate,
    flagged,
    gentleMessage: flagged
      ? GENTLE_MESSAGES[Math.floor(now / WINDOW_MS) % GENTLE_MESSAGES.length]
      : null,
  };
}
