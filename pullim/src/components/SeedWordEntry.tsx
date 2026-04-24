"use client";

import { useRef, useState } from "react";

interface SeedWordEntryProps {
  onSubmit: (word: string) => void;
  /** 진입 시 어느 테마로 갈 예정인지 표시용 레이블 (없으면 생략) */
  themeHint?: string;
}

const PLACEHOLDER_CYCLE = [
  "막막",
  "화남",
  "피곤",
  "설렘",
  "허탈",
  "무감각",
];

/**
 * 홈 진입 시 감각을 한 단어로 표현하는 빠른 입구.
 *
 * 철학 근거:
 * - "풀리는 세계" — 풀다의 13가지 뜻 중 #1 감정 풀기를 홈 레벨에서 직접 진입.
 * - 극한의 적응형 — 테마 고르는 것조차 부담스러운 사용자에게 2탭 진입.
 * - "부담스러워? 내릴게" (2026-03-30)
 */
export default function SeedWordEntry({ onSubmit, themeHint }: SeedWordEntryProps) {
  const [open, setOpen] = useState(false);
  const [word, setWord] = useState("");
  const [placeholder] = useState(
    () => PLACEHOLDER_CYCLE[Math.floor(Math.random() * PLACEHOLDER_CYCLE.length)],
  );
  // IME(한글 조합) 상태 — 조합 중 Enter는 무시
  const composingRef = useRef(false);

  function handleSubmit() {
    const trimmed = word.trim();
    if (trimmed.length === 0) return;
    onSubmit(trimmed.slice(0, 24));
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-rpg-sm transition-opacity hover:opacity-80 px-3 py-1.5 rounded-full"
        style={{
          color: "rgba(232,213,181,0.60)",
          border: "1px dashed rgba(232,213,181,0.25)",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        또는 한 단어로 시작
      </button>
    );
  }

  return (
    <div
      className="rpg-panel-light rounded-2xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300"
      style={{ border: "1px solid rgba(192,163,116,0.25)" }}
    >
      <div className="space-y-1">
        <p
          className="text-xs font-rpg-sm"
          style={{ color: "var(--fantasy-gold, rgba(192,163,116,0.85))" }}
        >
          🎐 지금 마음을 한 단어로
        </p>
        <p
          className="text-[10px] font-rpg-sm"
          style={{ color: "rgba(232,213,181,0.55)" }}
        >
          부담되면 그냥 X 누르고 평소대로 해
        </p>
      </div>
      <input
        type="text"
        value={word}
        onChange={(e) => setWord(e.target.value)}
        onCompositionStart={() => { composingRef.current = true; }}
        onCompositionEnd={() => { composingRef.current = false; }}
        onKeyDown={(e) => {
          // IME 조합 중 Enter는 한글 완성 이벤트로 소비되어야 함 — 무시
          if (e.key === "Enter" && !composingRef.current && !e.nativeEvent.isComposing) {
            handleSubmit();
          }
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder={placeholder}
        maxLength={24}
        autoFocus
        className="w-full px-3 py-2.5 rounded-xl text-sm font-rpg"
        style={{
          background: "rgba(0,0,0,0.35)",
          color: "rgba(232,213,181,0.95)",
          border: "1px solid rgba(192,163,116,0.25)",
          outline: "none",
        }}
      />
      {themeHint && (
        <p
          className="text-[10px] font-rpg-sm text-center"
          style={{ color: "rgba(232,213,181,0.45)" }}
        >
          입력 후 <span style={{ color: "var(--fantasy-gold, rgba(192,163,116,0.85))" }}>{themeHint}</span>로 시작해
        </p>
      )}
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={word.trim().length === 0}
          className="flex-1 py-2.5 rounded-xl text-xs font-rpg transition-all active:scale-[0.97] disabled:opacity-30"
          style={{
            background: "rgba(192,163,116,0.15)",
            color: "var(--fantasy-gold-bright, rgba(232,213,181,0.95))",
            border: "1px solid rgba(192,163,116,0.3)",
          }}
        >
          이거로 시작할게
        </button>
        <button
          onClick={() => {
            setOpen(false);
            setWord("");
          }}
          className="py-2.5 px-4 text-xs font-rpg-sm transition-opacity hover:opacity-80"
          style={{ color: "rgba(232,213,181,0.45)" }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
