"use client";

import { useEffect, useState } from "react";
import { computeFatigueWatch } from "@/lib/session/fatigue-watch";

const DISMISS_KEY = "pullim_fatigue_dismissed_at";
const DISMISS_TTL_MS = 24 * 60 * 60 * 1000;

function isDismissedToday(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = parseInt(raw, 10);
    if (Number.isNaN(ts)) return false;
    return Date.now() - ts < DISMISS_TTL_MS;
  } catch {
    return false;
  }
}

function markDismissed() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // 무시
  }
}

/**
 * 피로 임계 카드 — 홈 진입 시 일정 조건 충족 시 표시.
 *
 * 철학 근거:
 * - 극한의 적응형 "피곤해? 내일 하자"
 * - 강제 중단이 아닌 "쉼 권고" — 사용자가 닫으면 24h 동안 안 뜸
 * - "오래 안 오셨네요" 정반대 — "자주 왔지만 힘들어 보인다"에 반응
 */
export default function FatigueCard() {
  const [state, setState] = useState<{ flagged: boolean; message: string | null }>({
    flagged: false,
    message: null,
  });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    const refresh = () => {
      if (isDismissedToday()) {
        setDismissed(true);
        return;
      }
      const s = computeFatigueWatch();
      setState({ flagged: s.flagged, message: s.gentleMessage });
    };
    refresh();
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const handleDismiss = () => {
    markDismissed();
    setDismissed(true);
  };

  if (!state.flagged || !state.message || dismissed) return null;

  return (
    <div
      className="rpg-panel p-4 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-500"
      style={{ border: "1px solid rgba(180,160,200,0.25)" }}
    >
      <div className="space-y-1">
        <p
          className="text-[10px] font-rpg-sm"
          style={{ color: "rgba(180,160,200,0.85)" }}
        >
          🌙 쉼 권고
        </p>
        <p className="text-sm font-rpg leading-relaxed" style={{ color: "rgba(232,213,181,0.90)" }}>
          {state.message}
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleDismiss}
          className="rpg-button-ghost flex-1 py-2 text-xs font-rpg-sm"
          title="오늘 하루 동안 안 보이게"
        >
          접어둘게
        </button>
        <button
          onClick={handleDismiss}
          className="rpg-button flex-1 py-2 text-xs font-rpg-sm"
          title="그래도 하려면 평소대로 진행"
        >
          알겠어, 가볍게만
        </button>
      </div>
    </div>
  );
}
