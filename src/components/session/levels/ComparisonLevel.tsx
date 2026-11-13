"use client";

import type { ComparisonCard } from "@/lib/session/ladder-types";
import CheatButton from "../CheatButton";

interface ComparisonLevelProps {
  cards: [ComparisonCard, ComparisonCard];
  onSelectA: () => void;
  onSelectB: () => void;
  onNeither: () => void;
  onCheat: () => void;
}

export default function ComparisonLevel({
  cards,
  onSelectA,
  onSelectB,
  onNeither,
  onCheat,
}: ComparisonLevelProps) {
  const [a, b] = cards;

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <p className="text-sm text-center font-rpg" style={{ color: "rgba(255,255,255,0.5)" }}>이쪽이 더 끌려?</p>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onSelectA}
          className="glass-btn flex flex-col items-center gap-3 py-6 px-4 transition-all active:scale-95 hover:scale-[1.02]"
        >
          <span className="text-3xl">{a.emoji}</span>
          <span className="text-sm font-medium font-rpg" style={{ color: "rgba(255,255,255,0.9)" }}>{a.title}</span>
          <span className="text-xs text-center leading-relaxed font-rpg-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
            {a.description}
          </span>
        </button>

        <button
          onClick={onSelectB}
          className="glass-btn flex flex-col items-center gap-3 py-6 px-4 transition-all active:scale-95 hover:scale-[1.02]"
        >
          <span className="text-3xl">{b.emoji}</span>
          <span className="text-sm font-medium font-rpg" style={{ color: "rgba(255,255,255,0.9)" }}>{b.title}</span>
          <span className="text-xs text-center leading-relaxed font-rpg-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
            {b.description}
          </span>
        </button>
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          onClick={onNeither}
          className="text-xs font-rpg-sm transition-colors"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          둘 다 아닌데
        </button>
        <CheatButton onClick={onCheat} />
      </div>
    </div>
  );
}
