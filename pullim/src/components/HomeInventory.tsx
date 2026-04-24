"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getActivePromises } from "@/lib/session/promise-store";
import { listInsights } from "@/lib/session/insight-archive";
import type { PullimPromise } from "@/lib/session/ladder-types";
import type { Insight } from "@/lib/session/insight-archive";

/**
 * 홈 화면 "나를 기다리는 것들" 인벤토리.
 *
 * 철학 근거:
 * - "이건 거의 사랑이야" (2026-03-30) — 잊지 않고 돌아왔다는 신호
 * - holding environment — 지난 번 맥락을 지닌 채 맞이함
 * - 절대 금지 "오래 안 왔네요" — 이탈 부각 금지. 여기서는 "기다리는 것들"로 긍정 프레임.
 */
export default function HomeInventory() {
  const router = useRouter();
  const [promises, setPromises] = useState<PullimPromise[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    const refresh = () => {
      setPromises(getActivePromises());
      setInsights(listInsights());
    };
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const promiseCount = promises.length;
  const insightCount = insights.length;
  const starredCount = insights.filter((i) => i.starred).length;

  // 전부 비어있으면 표시하지 않음
  if (promiseCount === 0 && insightCount === 0) return null;

  return (
    <div className="flex items-center gap-2 justify-center flex-wrap">
      {promiseCount > 0 && (
        <button
          onClick={() => router.push("/archive")}
          className="text-[10px] px-3 py-1.5 rounded-full transition-all hover:scale-[1.03] active:scale-[0.97]"
          style={{
            background: "rgba(192,163,116,0.15)",
            border: "1px solid rgba(192,163,116,0.3)",
            color: "var(--fantasy-gold, rgba(192,163,116,0.85))",
          }}
          title="약속 확인은 다음 세션 진입 시 물어볼게"
        >
          💫 약속 {promiseCount}
        </button>
      )}
      {insightCount > 0 && (
        <button
          onClick={() => router.push("/archive")}
          className="text-[10px] px-3 py-1.5 rounded-full transition-all hover:scale-[1.03] active:scale-[0.97]"
          style={{
            background: "rgba(232,213,181,0.08)",
            border: "1px solid rgba(232,213,181,0.2)",
            color: "rgba(232,213,181,0.75)",
          }}
          title="네가 남긴 통찰"
        >
          {starredCount > 0 ? "⭐" : "☆"} 전당 {insightCount}
        </button>
      )}
    </div>
  );
}
