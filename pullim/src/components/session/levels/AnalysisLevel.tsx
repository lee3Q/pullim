"use client";

import type { AnalysisCard } from "@/lib/session/ladder-types";
import CheatButton from "../CheatButton";

interface AnalysisLevelProps {
  card: AnalysisCard;
  onAgree: () => void;
  onDisagree: () => void;
  onUnsure: () => void;
  onCheat: () => void;
}

export default function AnalysisLevel({
  card,
  onAgree,
  onDisagree,
  onUnsure,
  onCheat,
}: AnalysisLevelProps) {
  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* 분석 카드 */}
      <div
        className="rpg-panel rounded-2xl p-5 space-y-3"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-rpg-sm" style={{ color: "rgba(192,163,116,0.4)" }}>
            ✦ 풀림의 생각
          </span>
        </div>
        <p className="text-sm leading-relaxed font-rpg" style={{ color: "var(--fantasy-text)" }}>
          {card.analysis}
        </p>
      </div>

      {/* 3버튼 */}
      <div className="flex gap-2">
        <button
          onClick={onAgree}
          className="rpg-panel-light flex-1 py-3 rounded-xl text-sm font-rpg transition-all active:scale-95 hover:scale-[1.02]"
          style={{ color: "var(--fantasy-text)" }}
        >
          👍 맞아
        </button>
        <button
          onClick={onDisagree}
          className="rpg-panel-light flex-1 py-3 rounded-xl text-sm font-rpg transition-all active:scale-95 hover:scale-[1.02]"
          style={{ color: "var(--fantasy-text)" }}
        >
          🤔 아닌데
        </button>
        <button
          onClick={onUnsure}
          className="rpg-panel-light flex-1 py-3 rounded-xl text-sm font-rpg transition-all active:scale-95 hover:scale-[1.02]"
          style={{ color: "var(--fantasy-text)" }}
        >
          🤷 모르겠어
        </button>
      </div>

      <div className="flex justify-center">
        <CheatButton onClick={onCheat} />
      </div>
    </div>
  );
}
