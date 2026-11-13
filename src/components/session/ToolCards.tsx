"use client";

import type { DataCard } from "@/lib/types-ultimate";

export interface LadderPerspective {
  name: string;
  model: string;
  observation: string;
  question: string;
}

// ── ResearchCards ──────────────────────────────────────────────

interface ResearchCardsProps {
  cards: DataCard[];
  demoMode: boolean;
  onDismiss: () => void;
}

const CONFIDENCE_STYLE: Record<DataCard["confidence"], { label: string; color: string; bg: string }> = {
  high: { label: "높음", color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  medium: { label: "보통", color: "#facc15", bg: "rgba(250,204,21,0.12)" },
  low: { label: "낮음", color: "#f87171", bg: "rgba(248,113,113,0.12)" },
};

export function ResearchCards({ cards, demoMode, onDismiss }: ResearchCardsProps) {
  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-4 duration-400 rounded-2xl p-4 space-y-3 flex-shrink-0"
      style={{
        background: "rgba(26,22,18,0.85)",
        border: "1px solid rgba(192,163,116,0.25)",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-rpg-sm flex items-center gap-1.5"
          style={{ color: "var(--fantasy-gold)" }}
        >
          📚 리서치 결과
        </span>
        {demoMode && (
          <span
            className="text-[10px] px-2 py-0.5 rounded-full"
            style={{ background: "rgba(192,163,116,0.1)", color: "rgba(232,213,181,0.55)" }}
          >
            데모 데이터
          </span>
        )}
      </div>

      {/* 카드 목록 */}
      <div className="space-y-2">
        {cards.map((card, i) => {
          const conf = CONFIDENCE_STYLE[card.confidence];
          return (
            <div
              key={i}
              className="rounded-xl p-3 space-y-1.5"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(192,163,116,0.12)",
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <p
                  className="text-xs font-rpg leading-snug"
                  style={{ color: "var(--fantasy-text)" }}
                >
                  {card.title}
                </p>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: conf.bg, color: conf.color }}
                >
                  {conf.label}
                </span>
              </div>
              <p
                className="text-[11px] font-rpg-sm leading-relaxed"
                style={{ color: "rgba(232,213,181,0.80)" }}
              >
                {card.fact}
              </p>
              {card.source?.name && (
                <p
                  className="text-[10px] font-rpg-sm"
                  style={{ color: "rgba(232,213,181,0.45)" }}
                >
                  출처: {card.source.name}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* 닫기 버튼 */}
      <button
        onClick={onDismiss}
        className="w-full py-2.5 rounded-xl text-xs font-rpg transition-all active:scale-[0.98] hover:opacity-80"
        style={{
          background: "rgba(192,163,116,0.12)",
          color: "var(--fantasy-gold)",
          border: "1px solid rgba(192,163,116,0.20)",
        }}
      >
        확인
      </button>
    </div>
  );
}

// ── AnalysisView ───────────────────────────────────────────────

interface AnalysisViewProps {
  perspectives: LadderPerspective[];
  disagreement: string | null;
  demoMode: boolean;
  onDismiss: () => void;
  onSelectPerspective: (question: string) => void;
}

const PERSPECTIVE_ICONS: Record<string, string> = {
  "공감형 시각": "🫂",
  "분석형 시각": "📊",
  "도전형 시각": "⚡",
};

export function AnalysisView({
  perspectives,
  disagreement,
  demoMode,
  onDismiss,
  onSelectPerspective,
}: AnalysisViewProps) {
  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-4 duration-400 rounded-2xl p-4 space-y-3 flex-shrink-0"
      style={{
        background: "rgba(26,22,18,0.85)",
        border: "1px solid rgba(139,92,246,0.25)",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-rpg-sm flex items-center gap-1.5"
          style={{ color: "rgba(167,139,250,1)" }}
        >
          🔬 다각도 분석
        </span>
        {demoMode && (
          <span
            className="text-[10px] px-2 py-0.5 rounded-full"
            style={{ background: "rgba(139,92,246,0.1)", color: "rgba(232,213,181,0.55)" }}
          >
            데모 데이터
          </span>
        )}
      </div>

      {/* 관점 카드 목록 */}
      <div className="space-y-2">
        {perspectives.map((p, i) => {
          const icon = PERSPECTIVE_ICONS[p.name] ?? "💬";
          return (
            <div
              key={i}
              className="rounded-xl p-3 space-y-2"
              style={{
                background: "rgba(139,92,246,0.06)",
                border: "1px solid rgba(139,92,246,0.15)",
              }}
            >
              {/* 관점 이름 */}
              <p
                className="text-[11px] font-rpg-sm"
                style={{ color: "rgba(167,139,250,0.85)" }}
              >
                {icon} {p.name}
              </p>

              {/* 관찰 */}
              <p
                className="text-xs font-rpg leading-snug"
                style={{ color: "var(--fantasy-text)" }}
              >
                {p.observation}
              </p>

              {/* 질문 — 탭하면 세션에 주입 */}
              <button
                onClick={() => onSelectPerspective(p.question)}
                className="w-full text-left rounded-lg px-2.5 py-2 text-[11px] font-rpg-sm transition-all active:scale-[0.98] hover:opacity-80"
                style={{
                  background: "rgba(139,92,246,0.12)",
                  color: "rgba(167,139,250,1)",
                  border: "1px solid rgba(139,92,246,0.20)",
                }}
              >
                💭 {p.question}
              </button>
            </div>
          );
        })}
      </div>

      {/* 의견 갈리는 지점 */}
      {disagreement && (
        <div
          className="rounded-xl px-3 py-2.5"
          style={{
            background: "rgba(251,191,36,0.08)",
            border: "1px solid rgba(251,191,36,0.20)",
          }}
        >
          <p
            className="text-[11px] font-rpg-sm leading-snug"
            style={{ color: "rgba(251,191,36,0.90)" }}
          >
            ⚖️ 의견이 갈리는 지점: {disagreement}
          </p>
        </div>
      )}

      {/* 닫기 버튼 */}
      <button
        onClick={onDismiss}
        className="w-full py-2.5 rounded-xl text-xs font-rpg transition-all active:scale-[0.98] hover:opacity-80"
        style={{
          background: "rgba(139,92,246,0.12)",
          color: "rgba(167,139,250,1)",
          border: "1px solid rgba(139,92,246,0.20)",
        }}
      >
        닫기
      </button>
    </div>
  );
}
