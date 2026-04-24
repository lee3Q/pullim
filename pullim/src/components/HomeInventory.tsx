"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getActivePromises } from "@/lib/session/promise-store";
import { listInsights } from "@/lib/session/insight-archive";
import type { PullimPromise } from "@/lib/session/ladder-types";
import type { Insight } from "@/lib/session/insight-archive";

/**
 * 홈 "나를 기다리는 것들" 섹션.
 *
 * UX 감사 반영 (Agent 3, 2026-04-23):
 * - 카운트 숫자 표시 제거 (게이미피케이션 → 자책 유발 방지)
 * - 최근 1개 미리보기로 전환 — "저장된 내용" 자체가 CTA
 * - 빈 상태는 그대로 숨김
 *
 * 철학 근거:
 * - "오래 안 오셨네요" 금지 + "빈도가 지표" 금지
 * - 사용자에게 숫자가 쌓인 것을 자랑하거나 부족함을 지적하지 않음
 * - 단지 "네가 남긴 것이 여기 있어" 수준의 잔잔한 표지
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

  // 최근 것 1개씩 (시간 내림차순)
  const latestPromise = [...promises].sort((a, b) => b.createdAt - a.createdAt)[0] ?? null;
  const oneLiners = insights.filter((i) => i.context === "(오늘의 한 문장)");
  const latestOneLiner = [...oneLiners].sort((a, b) => b.createdAt - a.createdAt)[0] ?? null;
  const deepInsights = insights.filter((i) => i.context !== "(오늘의 한 문장)");
  const latestInsight = [...deepInsights].sort((a, b) => b.createdAt - a.createdAt)[0] ?? null;

  if (!latestPromise && !latestOneLiner && !latestInsight) return null;

  const truncate = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n - 1) + "…");

  return (
    <div className="flex flex-col items-center gap-1.5">
      {latestOneLiner && (
        <button
          onClick={() => router.push("/archive")}
          className="text-[11px] font-rpg-sm px-3 py-1.5 rounded-full transition-all hover:opacity-90 max-w-full"
          style={{
            background: "rgba(192,163,116,0.10)",
            border: "1px solid rgba(192,163,116,0.25)",
            color: "rgba(232,213,181,0.80)",
          }}
          aria-label="최근 남긴 한 문장 보기"
        >
          🪷 {truncate(latestOneLiner.content, 28)}
        </button>
      )}
      {latestInsight && (
        <button
          onClick={() => router.push("/archive")}
          className="text-[11px] font-rpg-sm px-3 py-1.5 rounded-full transition-all hover:opacity-90 max-w-full"
          style={{
            background: "rgba(232,213,181,0.08)",
            border: "1px solid rgba(232,213,181,0.2)",
            color: "rgba(232,213,181,0.75)",
          }}
          aria-label="최근 남긴 통찰 보기"
        >
          ⭐ {truncate(latestInsight.content, 28)}
        </button>
      )}
      {latestPromise && (
        <button
          onClick={() => router.push("/archive")}
          className="text-[11px] font-rpg-sm px-3 py-1.5 rounded-full transition-all hover:opacity-90 max-w-full"
          style={{
            background: "rgba(180,160,200,0.08)",
            border: "1px solid rgba(180,160,200,0.2)",
            color: "rgba(232,213,181,0.70)",
          }}
          aria-label="최근 약속 보기"
        >
          💫 {truncate(latestPromise.action, 28)}
        </button>
      )}
    </div>
  );
}
