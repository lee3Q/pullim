"use client";

import { useEffect, useState } from "react";
import { computeFatigueWatch } from "@/lib/session/fatigue-watch";

/**
 * 피로 임계 카드 — 홈 진입 시 일정 조건 충족 시 표시.
 *
 * 철학 근거:
 * - 극한의 적응형 "피곤해? 내일 하자"
 * - 강제 중단이 아닌 "쉼 권고" — 사용자가 닫으면 그냥 사라짐
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
          onClick={() => setDismissed(true)}
          className="rpg-button-ghost flex-1 py-2 text-xs font-rpg-sm"
          title="오늘은 그냥 넘어갈게"
        >
          접어둘게
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="rpg-button flex-1 py-2 text-xs font-rpg-sm"
          title="그래도 하려면 평소대로 진행"
        >
          알겠어, 가볍게만
        </button>
      </div>
    </div>
  );
}
