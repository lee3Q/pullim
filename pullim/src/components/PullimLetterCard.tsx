"use client";

import { useEffect, useState } from "react";
import {
  canGenerateLetter,
  generateLetter,
  markLetterSent,
  getLastLetter,
  type LetterSnapshot,
} from "@/lib/session/pullim-letter";

/**
 * 풀림의 편지 카드 — 주기적 관찰 정리.
 *
 * 철학 근거:
 * - 홀딩 환경 + 유대 강화 + 성장 가시화
 * - "오래 안 오셨네요" 금지와 반대축 — "같이 쌓아온 것" 프레임
 * - 북극성 확장 "풀렸다가, 모이는 세계"의 "모이는" 극단 구현
 *
 * 표시 조건 (컴포넌트 내부 판단):
 * 1) 마지막 편지 발송 후 7일 경과 + 최소 활동 (통찰 5+ 또는 확인약속 3+)
 * 2) 또는 기존 편지 다시 보기 (아카이브 성격)
 */
export default function PullimLetterCard() {
  const [snapshot, setSnapshot] = useState<LetterSnapshot | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (canGenerateLetter()) {
      const fresh = generateLetter();
      setSnapshot(fresh);
      setIsNew(true);
    } else {
      setSnapshot(getLastLetter());
      setIsNew(false);
    }
  }, []);

  if (!snapshot) return null;

  // 새 편지가 있으면 홈에 띠 형태로, 탭해서 펼침.
  // 새 편지 없으면 조용히 숨김 (이전 편지는 별도 경로에서만 노출 — 일단 생략).
  if (!isNew && !open) return null;

  const stats = snapshot.stats;

  return (
    <div
      className="rpg-panel p-4 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-500"
      style={{ border: "1px solid rgba(192,163,116,0.30)" }}
    >
      <div className="flex items-center justify-between">
        <p
          className="text-[10px] font-rpg-sm"
          style={{ color: "var(--fantasy-gold, rgba(192,163,116,0.85))" }}
        >
          ✉️ 풀림의 편지
        </p>
        <span className="text-[10px] font-rpg-sm" style={{ color: "rgba(232,213,181,0.45)" }}>
          {new Date(snapshot.generatedAt).toLocaleDateString("ko-KR", {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>

      <p
        className="text-sm font-rpg leading-relaxed"
        style={{ color: "rgba(232,213,181,0.92)" }}
      >
        {snapshot.body}
      </p>

      {open && (
        <div
          className="grid grid-cols-2 gap-2 text-[10px] font-rpg-sm pt-2"
          style={{ borderTop: "1px dashed rgba(192,163,116,0.2)" }}
        >
          <div style={{ color: "rgba(232,213,181,0.55)" }}>
            전당 문장 <span style={{ color: "rgba(232,213,181,0.85)" }}>{stats.totalInsights}</span>
          </div>
          <div style={{ color: "rgba(232,213,181,0.55)" }}>
            약속 이행 <span style={{ color: "rgba(232,213,181,0.85)" }}>{stats.completedPromises}</span> / {stats.totalPromises}
          </div>
          <div style={{ color: "rgba(232,213,181,0.55)" }}>
            피드백 <span style={{ color: "rgba(232,213,181,0.85)" }}>{stats.totalFeedbacks}</span>
          </div>
          <div style={{ color: "rgba(232,213,181,0.55)" }}>
            맞춤율 <span style={{ color: "rgba(232,213,181,0.85)" }}>{(stats.confirmRate * 100).toFixed(0)}%</span>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setOpen((v) => !v)}
          className="rpg-button-ghost flex-1 py-2 text-xs font-rpg-sm"
        >
          {open ? "덮어둘게" : "자세히"}
        </button>
        {isNew && (
          <button
            onClick={() => {
              markLetterSent(snapshot);
              setIsNew(false);
            }}
            className="rpg-button flex-1 py-2 text-xs font-rpg-sm"
          >
            잘 받았어
          </button>
        )}
      </div>
    </div>
  );
}
