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
  cards,
  onSelect,
  onCheat,
}: SensoryLevelProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => onSelect(card.id)}
            className="glass-btn flex flex-col items-center gap-2 py-6 px-4 transition-all active:scale-95 hover:scale-[1.02]"
          >
            <span className="text-3xl">{card.emoji}</span>
            <span className="text-xs font-rpg-sm" style={{ color: "rgba(255,255,255,0.85)" }}>{card.label}</span>
          </button>
        ))}
      </div>

      <div className="flex justify-center">
        <CheatButton onClick={onCheat} />
      </div>
    </div>
  );
}
