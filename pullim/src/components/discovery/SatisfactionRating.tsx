"use client";

import { useState } from "react";

interface Props {
  onRate: (score: number | null) => void;
  primaryColor: string;
}

export default function SatisfactionRating({ onRate, primaryColor }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (score: number) => {
    setSelected(score);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    onRate(selected);
  };

  const handleSkip = () => {
    setSubmitted(true);
    onRate(null);
  };

  if (submitted) {
    return (
      <div
        className="text-center py-6"
        style={{ animation: "stage-fade-in 0.4s ease-out" }}
      >
        <p className="text-sm font-rpg" style={{ color: `${primaryColor}cc` }}>
          {selected ? "고맙네, 여행자여." : "다음에 물어보겠네."}
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center gap-4 py-4"
      style={{ animation: "stage-fade-in 0.4s ease-out" }}
    >
      <p className="text-sm font-rpg text-white/70">오늘 여정은 어땠는가?</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            onClick={() => handleSelect(score)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-200"
            style={{
              background:
                selected === score
                  ? `${primaryColor}40`
                  : "rgba(255,255,255,0.05)",
              border:
                selected === score
                  ? `2px solid ${primaryColor}`
                  : "2px solid transparent",
              transform: selected === score ? "scale(1.15)" : "scale(1)",
            }}
          >
            {"⭐"}
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        <button
          onClick={handleSkip}
          className="text-xs font-rpg text-white/30 hover:text-white/50 transition-colors"
        >
          건너뛰기
        </button>
        {selected && (
          <button
            onClick={handleSubmit}
            className="rpg-button px-4 py-1.5 text-xs"
            style={{ animation: "stage-fade-in 0.2s ease-out" }}
          >
            확인
          </button>
        )}
      </div>
    </div>
  );
}
