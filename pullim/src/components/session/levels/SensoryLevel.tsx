"use client";

import type { SensoryCard } from "@/lib/session/ladder-types";
import CheatButton from "../CheatButton";

interface SensoryLevelProps {
  question: string;
  cards: SensoryCard[];
  onSelect: (cardId: string) => void;
  onCheat: () => void;
}

export default function SensoryLevel({
  question,
  cards,
  onSelect,
  onCheat,
}: SensoryLevelProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <p className="text-sm text-center leading-relaxed font-rpg" style={{ color: "var(--fantasy-text)" }}>
        {question}
      </p>

      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => onSelect(card.id)}
            className="rpg-panel-light flex flex-col items-center gap-2 py-6 px-4 rounded-2xl transition-all active:scale-95 hover:scale-[1.02]"
          >
            <span className="text-3xl">{card.emoji}</span>
            <span className="text-xs font-rpg-sm" style={{ color: "var(--fantasy-text)" }}>{card.label}</span>
          </button>
        ))}
      </div>

      <div className="flex justify-center">
        <CheatButton onClick={onCheat} />
      </div>
    </div>
  );
}
