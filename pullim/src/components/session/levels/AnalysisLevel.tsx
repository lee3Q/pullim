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
      <div className="glass-panel p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-rpg-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            ✦ 풀림의 생각
          </span>
        </div>
        <p className="text-sm leading-relaxed font-rpg" style={{ color: "rgba(255,255,255,0.85)" }}>
          {card.analysis}
        </p>
      </div>

      {/* 3버튼 */}
      <div className="flex gap-2">
        <button
          onClick={onAgree}
          className="glass-btn flex-1 py-3 text-sm font-rpg transition-all active:scale-95 hover:scale-[1.02]"
        >
          👍 맞아
        </button>
        <button
          onClick={onDisagree}
          className="glass-btn flex-1 py-3 text-sm font-rpg transition-all active:scale-95 hover:scale-[1.02]"
        >
          🤔 아닌데
        </button>
        <button
          onClick={onUnsure}
          className="glass-btn flex-1 py-3 text-sm font-rpg transition-all active:scale-95 hover:scale-[1.02]"
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
