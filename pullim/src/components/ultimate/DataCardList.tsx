"use client";

import { useState } from "react";
import { DataCard } from "@/lib/types-ultimate";

interface Props {
  cards: DataCard[];
  primaryColor: string;
  onSelect: (index: number) => void;
  disabled?: boolean;
}

export default function DataCardList({ cards, primaryColor, onSelect, disabled = false }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleSelect = (index: number) => {
    if (disabled) return;
    setSelectedIndex(index);
    onSelect(index);
  };

  return (
    <div className="flex flex-col gap-3 w-full max-w-md mx-auto">
      {cards.map((card, i) => {
        const isSelected = selectedIndex === i;

        return (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            disabled={disabled}
            className={`text-left rounded-xl px-4 py-3 transition-all ${
              disabled ? "pointer-events-none" : "cursor-pointer"
            } ${isSelected ? "rpg-panel" : "rpg-panel-light"}`}
            style={{
              borderColor: isSelected ? primaryColor : undefined,
              boxShadow: isSelected ? `0 0 20px ${primaryColor}20, inset 0 0 15px rgba(0,0,0,0.1)` : undefined,
            }}
          >
            <p className="text-sm font-rpg text-white/80">{card.title}</p>
            <p className="text-sm text-white/60 mt-1">&ldquo;{card.fact}&rdquo;</p>
            <p className="text-[11px] text-white/45 mt-2 font-rpg-sm">
              ─ {card.source.name}
              {card.confidence === "low" && " (제한적 데이터)"}
            </p>
          </button>
        );
      })}
    </div>
  );
}
