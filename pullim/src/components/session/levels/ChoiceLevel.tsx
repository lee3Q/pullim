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

/**
 * Level 4 — 선택지 제시.
 *
 * UX 감사 반영 (Agent 3, 2026-04-23):
 * - [추천] 배지 제거 — 우울 상태 사용자에게 권위로 작용해 자기 판단 위축
 * - 주 선택지 최대 3개로 하드캡 — 옵션 과잉이 결정 마비 유발
 * - "모르겠어" 계열(isFallback)을 주 선택지 **바깥**에 별도 분리
 * - 보조 액션 (직접 쓸래 / 다 별로야)는 하단에 조용히
 *
 * showRecommendations prop은 호환성 위해 남겨두되 사용 안 함 (추후 제거 예정).
 */
export default function ChoiceLevel({
  text: _text,
  options,
  cheatText,
  showRecommendations: _showRecommendations,
  onSelect,
  onFreeText,
  onCheat,
}: ChoiceLevelProps) {
  // fallback(모르겠어)과 주 선택지 분리
  const mainOptions = options.filter((o) => !o.isFallback).slice(0, 3);
  const fallbackOption = options.find((o) => o.isFallback);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="space-y-2">
        {mainOptions.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            className="glass-btn w-full text-left py-3 px-4 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{opt.emoji}</span>
              <span className="text-sm">{opt.text}</span>
            </div>
          </button>
        ))}
      </div>

      {fallbackOption && (
        <button
          onClick={() => onSelect(fallbackOption.id)}
          className="w-full py-2 text-xs font-rpg-sm transition-opacity hover:opacity-80"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          {fallbackOption.emoji} {fallbackOption.text}
        </button>
      )}

      <div className="flex items-center justify-between pt-1">
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
