"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { listInsights, toggleStar, removeInsight, type Insight } from "@/lib/session/insight-archive";
import { getPromiseHistory } from "@/lib/session/promise-store";
import type { PullimPromise } from "@/lib/session/ladder-types";

const THEME_LABEL: Record<string, string> = {
  "모험가": "🗺️ 모험가",
  "달빛정원": "🌙 달빛정원",
  "전략실": "📊 전략실",
  "천문대": "🔭 천문대",
  "종말": "🔥 종말",
};

type Tab = "insights" | "promises";

export default function ArchivePage() {
  const router = useRouter();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [promises, setPromises] = useState<PullimPromise[]>([]);
  const [filter, setFilter] = useState<"all" | "starred">("all");
  const [tab, setTab] = useState<Tab>("insights");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInsights(listInsights());
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPromises(getPromiseHistory().sort((a, b) => b.createdAt - a.createdAt));
  }, []);

  const shown = filter === "starred" ? insights.filter((i) => i.starred) : insights;

  const promiseStatusLabel: Record<PullimPromise["status"], string> = {
    active: "⏳ 진행 중",
    completed: "✓ 지킨 약속",
    failed: "× 못 지킴",
    skipped: "– 넘어감",
  };
  const promiseStatusColor: Record<PullimPromise["status"], string> = {
    active: "rgba(192,163,116,0.85)",
    completed: "rgba(160,200,130,0.85)",
    failed: "rgba(220,140,140,0.75)",
    skipped: "rgba(200,200,200,0.55)",
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#12101a] via-[#1a1530] to-[#1e1a28]" />
        <div className="absolute inset-0 opacity-50">
          <Image
            src="/assets/home-bg.webp"
            alt=""
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />
      </div>

      <header className="px-4 py-3 flex items-center gap-3 relative z-10">
        <button
          onClick={() => router.back()}
          className="rpg-button-ghost px-3 py-1.5 text-xs font-rpg-sm"
        >
          &larr; 뒤로
        </button>
        <span className="text-sm font-rpg text-white/70">⭐ 명예의 전당</span>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-4 relative z-10 w-full">
        <div className="w-full max-w-sm md:max-w-lg lg:max-w-xl space-y-4">
          <div className="text-center space-y-1">
            <p className="text-xs font-rpg-sm text-white/50 italic">
              {tab === "insights"
                ? "자신의 삶을 관통하는 통찰은 자신만 낼 수 있어."
                : "작은 약속, 틀려도 데이터."}
            </p>
          </div>

          {/* 탭 */}
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setTab("insights")}
              className="glass-btn px-4 py-2 text-xs font-rpg-sm"
              style={{
                color: tab === "insights" ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.45)",
              }}
            >
              ☆ 통찰 ({insights.length})
            </button>
            <button
              onClick={() => setTab("promises")}
              className="glass-btn px-4 py-2 text-xs font-rpg-sm"
              style={{
                color: tab === "promises" ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.45)",
              }}
            >
              💫 약속 ({promises.length})
            </button>
          </div>

          {tab === "insights" && (
          <>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setFilter("all")}
              className="glass-btn px-4 py-2 text-xs font-rpg-sm"
              style={{
                color:
                  filter === "all"
                    ? "rgba(255,255,255,0.9)"
                    : "rgba(255,255,255,0.45)",
              }}
            >
              전체 ({insights.length})
            </button>
            <button
              onClick={() => setFilter("starred")}
              className="glass-btn px-4 py-2 text-xs font-rpg-sm"
              style={{
                color:
                  filter === "starred"
                    ? "rgba(255,255,255,0.9)"
                    : "rgba(255,255,255,0.45)",
              }}
            >
              ⭐ 별표 ({insights.filter((i) => i.starred).length})
            </button>
          </div>

          {shown.length === 0 ? (
            <div className="rpg-panel px-8 py-10 text-center space-y-3">
              <p className="text-2xl">🌙</p>
              <p className="text-sm text-white/65 font-rpg">
                {filter === "starred"
                  ? "아직 별표한 기록이 없어."
                  : "아직 아카이브된 순간이 없어."}
              </p>
              <p className="text-xs text-white/40 font-rpg-sm">
                세션 중 네가 깊은 것을 말하면 풀림이 제안해줘.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {shown.map((insight) => (
                <div
                  key={insight.id}
                  className="glass-panel p-4 rounded-2xl space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-rpg-sm text-white/50">
                        {THEME_LABEL[insight.theme] || insight.theme}
                      </span>
                      <span className="text-[10px] text-white/35">
                        {new Date(insight.createdAt).toLocaleDateString("ko-KR", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={async () => {
                          const text = `"${insight.content}"\n\n— 풀림에서 ${new Date(insight.createdAt).toLocaleDateString("ko-KR")}`;
                          const nav = typeof navigator !== "undefined" ? navigator : undefined;
                          if (nav && "share" in nav && typeof nav.share === "function") {
                            try {
                              await nav.share({ text, title: "풀림에서 남긴 순간" });
                            } catch {
                              // 취소는 무시
                            }
                          } else if (nav?.clipboard) {
                            try {
                              await nav.clipboard.writeText(text);
                              alert("복사됐어");
                            } catch {
                              // 무시
                            }
                          }
                        }}
                        className="px-2 py-1 text-xs text-white/40 hover:text-white/70 transition-colors"
                        title="공유 (또는 복사)"
                      >
                        ↗
                      </button>
                      <button
                        onClick={() => setInsights(toggleStar(insight.id))}
                        className="px-2 py-1 text-xs transition-opacity hover:opacity-80"
                        title={insight.starred ? "별표 해제" : "별표"}
                      >
                        {insight.starred ? "⭐" : "☆"}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("이 기록 지울까?")) {
                            setInsights(removeInsight(insight.id));
                          }
                        }}
                        className="px-2 py-1 text-xs text-white/30 hover:text-white/60 transition-colors"
                        title="삭제"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {insight.context && (
                    <p className="text-[10px] font-rpg-sm italic text-white/40">
                      풀림: {insight.context}
                    </p>
                  )}

                  <p
                    className="text-sm font-rpg leading-relaxed"
                    style={{ color: "rgba(255,255,255,0.9)" }}
                  >
                    {insight.content}
                  </p>
                </div>
              ))}
            </div>
          )}
          </>
          )}

          {/* 약속 탭 */}
          {tab === "promises" && (
            promises.length === 0 ? (
              <div className="rpg-panel px-8 py-10 text-center space-y-3">
                <p className="text-2xl">💫</p>
                <p className="text-sm text-white/65 font-rpg">
                  아직 약속이 없어.
                </p>
                <p className="text-xs text-white/40 font-rpg-sm">
                  세션이 끝날 때 풀림이 제안해줘.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {promises.map((p) => (
                  <div
                    key={p.id}
                    className="glass-panel p-4 rounded-2xl space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[10px] font-rpg-sm"
                        style={{ color: promiseStatusColor[p.status] }}
                      >
                        {promiseStatusLabel[p.status]}
                      </span>
                      <span className="text-[10px] text-white/35">
                        {new Date(p.createdAt).toLocaleDateString("ko-KR", {
                          month: "short",
                          day: "numeric",
                        })}
                        {p.sessionTheme ? ` · ${p.sessionTheme}` : ""}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p
                        className="text-xs font-rpg-sm"
                        style={{ color: "rgba(192,167,136,0.70)" }}
                      >
                        <span style={{ color: "var(--fantasy-gold-bright)" }}>만약</span> {p.trigger}
                      </p>
                      <p
                        className="text-sm font-rpg leading-relaxed"
                        style={{ color: "rgba(255,255,255,0.9)" }}
                      >
                        → {p.action}
                      </p>
                      {p.reflection && (
                        <p className="text-[11px] font-rpg-sm italic text-white/55 pt-1">
                          “{p.reflection}”
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </main>

      <footer className="text-center text-xs text-white/25 py-4 relative z-10">
        풀림은 전문 상담을 대체하지 않습니다.
      </footer>
    </div>
  );
}
