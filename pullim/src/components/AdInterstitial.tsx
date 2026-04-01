"use client";

import { useEffect, useState } from "react";

interface Props {
  onClose: () => void;
  placement: "session-start" | "session-end";
  theme?: string;
}

const THEME_COLORS: Record<string, string> = {
  "모험가": "border-amber-500/60 text-amber-400",
  "달빛정원": "border-violet-400/60 text-violet-300",
  "전략실": "border-sky-400/60 text-sky-300",
  "천문대": "border-indigo-400/60 text-indigo-300",
  "종말": "border-rose-500/60 text-rose-400",
};

const COUNTDOWN_SECONDS = 3;

export default function AdInterstitial({ onClose, placement, theme }: Props) {
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  const themeColor = (theme && THEME_COLORS[theme]) ?? "border-stone-500/60 text-stone-300";
  const [borderClass, textClass] = themeColor.split(" ");

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const canClose = countdown <= 0;

  const headingText =
    placement === "session-start"
      ? "잠시 후 세션이 시작됩니다"
      : "세션이 끝났습니다. 다음에 또 만나요";

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-950/95 border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl flex flex-col items-center gap-5 p-6">
        {/* 헤더 */}
        <p className="text-white/70 text-sm font-serif tracking-wide text-center">
          {headingText}
        </p>

        {/* 광고 슬롯 (300:250 비율) */}
        <div
          className={`w-full aspect-[300/250] rounded-xl border-2 ${borderClass} flex flex-col items-center justify-center gap-2 bg-black/30`}
        >
          <span className={`text-xs font-medium tracking-widest uppercase ${textClass} opacity-60`}>
            Ad
          </span>
          <span className="text-white/20 text-sm font-serif">광고 영역</span>
          <span className="text-white/10 text-xs mt-1">300 × 250</span>
        </div>

        {/* 카운트다운 / 닫기 */}
        <div className="w-full flex flex-col gap-2">
          <button
            onClick={canClose ? onClose : undefined}
            disabled={!canClose}
            className={`w-full py-3 rounded-xl text-sm font-serif tracking-wide transition-all duration-300 ${
              canClose
                ? "bg-white/10 text-white/80 hover:bg-white/15 cursor-pointer"
                : "bg-white/5 text-white/30 cursor-not-allowed"
            }`}
          >
            {canClose ? "닫기" : `${countdown}초 후 닫기`}
          </button>

          {/* 유료 사용자용 — 현재 비활성 */}
          <button
            disabled
            className="w-full py-2 rounded-xl text-xs text-white/20 cursor-not-allowed"
          >
            광고 없이 시작 (구독자 전용)
          </button>
        </div>
      </div>
    </div>
  );
}
