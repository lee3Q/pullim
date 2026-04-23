"use client";

import { useEffect, useState } from "react";

interface InsightArchiveToastProps {
  preview: string;
  onAccept: () => void;
  onDismiss: () => void;
  autoHideMs?: number;
}

export default function InsightArchiveToast({
  preview,
  onAccept,
  onDismiss,
  autoHideMs = 12000,
}: InsightArchiveToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, autoHideMs);
    return () => clearTimeout(timer);
  }, [autoHideMs, onDismiss]);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm animate-in slide-in-from-bottom-4 duration-300"
      style={{ zIndex: 40 }}
    >
      <div className="glass-panel rounded-2xl p-4 space-y-3">
        <div className="space-y-1">
          <p
            className="text-[10px] font-rpg-sm flex items-center gap-1"
            style={{ color: "var(--fantasy-gold, rgba(192,163,116,0.85))" }}
          >
            ⭐ 명예의 전당
          </p>
          <p
            className="text-sm font-rpg leading-relaxed"
            style={{ color: "rgba(255,255,255,0.9)" }}
          >
            너 방금 진짜 대단한 걸 말했어.
          </p>
          <p
            className="text-xs font-rpg-sm italic line-clamp-2"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            &ldquo;{preview}&rdquo;
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              setVisible(false);
              onAccept();
            }}
            className="glass-btn flex-1 py-2.5 text-xs font-rpg"
            style={{ color: "var(--fantasy-gold, rgba(192,163,116,0.9))" }}
          >
            ⭐ 기억할게
          </button>
          <button
            onClick={() => {
              setVisible(false);
              setTimeout(onDismiss, 300);
            }}
            className="py-2.5 px-3 text-xs font-rpg-sm transition-opacity hover:opacity-80"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            아냐
          </button>
        </div>
      </div>
    </div>
  );
}
