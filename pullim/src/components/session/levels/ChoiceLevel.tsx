"use client";

import type { LadderOption } from "@/lib/session/ladder-types";
import CheatButton from "../CheatButton";

interface ChoiceLevelProps {
  text: string;
  options: LadderOption[];
  cheatText?: string;
  showRecommendations: boolean;
  onSelect: (optionId: string) => void;
  onFreeText: () => void;
  onCheat: () => void;
}

export default function ChoiceLevel({
  text,
  options,
  cheatText,
  showRecommendations,
  onSelect,
  onFreeText,
  onCheat,
}: ChoiceLevelProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="space-y-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            className={`glass-btn w-full text-left py-3 px-4 transition-all active:scale-[0.98] ${
              opt.isFallback ? "opacity-60" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg">{opt.emoji}</span>
                <span className="text-sm">{opt.text}</span>
              </div>
              {opt.isRecommended && showRecommendations && (
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)" }}>
                  추천
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={onFreeText}
          className="text-xs font-rpg-sm transition-colors"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          직접 쓸게
        </button>
        <CheatButton text={cheatText || "다 별로야"} onClick={onCheat} />
      </div>
    </div>
  );
}
