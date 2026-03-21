"use client";

import { useState } from "react";
import { DataCard } from "@/lib/types-ultimate";

interface FactcheckResult {
  confidence: "high" | "medium" | "low";
  issues: string[];
  passed: boolean;
}

interface Props {
  cards: DataCard[];
  primaryColor: string;
  onSelect: (index: number) => void;
  disabled?: boolean;
  factcheckResult?: FactcheckResult | null;
}

export default function DataCardList({ cards, primaryColor, onSelect, disabled = false, factcheckResult }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleSelect = (index: number) => {
    if (disabled) return;
    setSelectedIndex(index);
    onSelect(index);
  };

  return (
    <div className="flex flex-col gap-3 w-full max-w-md mx-auto">
      {/* 검증 상태 배지 (factcheck 결과가 있을 때만) */}
      {factcheckResult && (
        <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg ${
          factcheckResult.passed
            ? "bg-white/5 text-white/50"
            : "bg-amber-900/30 text-amber-300/80"
        }`}>
          <span>{factcheckResult.passed ? "✓" : "⚠"}</span>
          <span>{factcheckResult.passed ? "확인됨" : "주의 필요"}</span>
          {!factcheckResult.passed && factcheckResult.issues.length > 0 && (
            <span className="text-white/30 ml-1">— {factcheckResult.issues[0]}</span>
          )}
        </div>
      )}

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
