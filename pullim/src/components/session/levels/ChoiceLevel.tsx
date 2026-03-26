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
      {text && (
        <p className="text-sm leading-relaxed font-rpg" style={{ color: "var(--fantasy-text)" }}>{text}</p>
      )}

      <div className="space-y-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            className="w-full text-left py-3 px-4 rounded-xl transition-all active:scale-[0.98] font-rpg"
            style={{
              background: opt.isFallback
                ? "rgba(26,22,18,0.4)"
                : "linear-gradient(145deg, var(--fantasy-leather), var(--fantasy-leather-deep))",
              border: opt.isFallback
                ? "1px solid rgba(192,163,116,0.15)"
                : "1px solid var(--fantasy-gold-dark)",
              color: opt.isFallback ? "rgba(192,167,136,0.45)" : "var(--fantasy-button-text)",
              boxShadow: opt.isFallback
                ? "none"
                : "0 2px 0 var(--fantasy-leather-darkest), 0 3px 8px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)",
              textShadow: opt.isFallback ? "none" : "0 1px 0 var(--fantasy-leather-darkest)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg">{opt.emoji}</span>
                <span className="text-sm">{opt.text}</span>
              </div>
              {opt.isRecommended && showRecommendations && (
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(192,163,116,0.25)", color: "var(--fantasy-gold-bright)" }}>
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
          style={{ color: "rgba(192,163,116,0.35)" }}
        >
          직접 쓸게
        </button>
        <CheatButton text={cheatText || "다 별로야"} onClick={onCheat} />
      </div>
    </div>
  );
}
