"use client";

import { useState, useRef, useCallback } from "react";

interface CheatButtonProps {
  text?: string;
  onClick: () => void;
}

export default function CheatButton({
  text = "다 별로야",
  onClick,
}: CheatButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = useCallback(() => {
    if (confirming) {
      // 2탭: 실제 발동
      if (timerRef.current) clearTimeout(timerRef.current);
      setConfirming(false);
      onClick();
    } else {
      // 1탭: 확인 표시
      setConfirming(true);
      timerRef.current = setTimeout(() => {
        setConfirming(false);
      }, 3000); // 3초 후 자동 리셋
    }
  }, [confirming, onClick]);

  return (
    <button
      onClick={handleClick}
      className={`text-xs transition-all py-1 px-3 rounded-full font-rpg-sm ${
        confirming ? "scale-105" : ""
      }`}
      style={{
        color: confirming ? "rgba(220,120,120,0.8)" : "rgba(180,100,100,0.5)",
        border: confirming
          ? "1px solid rgba(220,120,120,0.4)"
          : "1px solid rgba(180,100,100,0.2)",
        background: confirming
          ? "rgba(160,60,60,0.2)"
          : "rgba(120,50,50,0.1)",
      }}
    >
      {confirming ? "정말?" : text}
    </button>
  );
}
