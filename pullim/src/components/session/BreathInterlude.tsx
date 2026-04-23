"use client";

import { useEffect, useState } from "react";

interface BreathInterludeProps {
  onClose: (completed: boolean) => void;
}

type Phase = "intro" | "inhale" | "hold" | "exhale" | "rest" | "done";

const CYCLE_MS = {
  inhale: 4000,
  hold: 1500,
  exhale: 5500,
  rest: 1000,
} as const;
const CYCLES = 3;

/**
 * "풀다" 13가지 뜻 중 #13 — 긴장 풀기.
 *
 * 세션 도중 "잠깐 숨만 쉴래"를 지원.
 * 3회 4-1.5-5.5 사이클. 완료 시 AI에 "숨 돌리고 왔다" 맥락을 흘린다 (바깥에서 처리).
 *
 * 철학 근거:
 * - "부담스러워? 내릴게. 피곤해? 내일 하자." (극한의 적응형)
 * - 대화만이 풀림이 아니다. 몸 상태 풀기도 풀림.
 */
export default function BreathInterlude({ onClose }: BreathInterludeProps) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [cycleIdx, setCycleIdx] = useState(0);

  useEffect(() => {
    if (phase === "intro") return;
    if (phase === "done") return;

    if (phase === "rest" && cycleIdx >= CYCLES - 1) {
      const t = setTimeout(() => setPhase("done"), CYCLE_MS.rest);
      return () => clearTimeout(t);
    }

    const nextPhase: Record<Exclude<Phase, "intro" | "done">, Phase> = {
      inhale: "hold",
      hold: "exhale",
      exhale: "rest",
      rest: "inhale",
    };
    const duration = CYCLE_MS[phase as keyof typeof CYCLE_MS];
    const t = setTimeout(() => {
      if (phase === "rest") setCycleIdx((i) => i + 1);
      setPhase(nextPhase[phase as Exclude<Phase, "intro" | "done">]);
    }, duration);
    return () => clearTimeout(t);
  }, [phase, cycleIdx]);

  const phaseLabel: Record<Phase, string> = {
    intro: "준비됐어?",
    inhale: "들이마셔",
    hold: "잠깐",
    exhale: "내쉬어",
    rest: "…",
    done: "좋아",
  };

  const orbScale: Record<Phase, number> = {
    intro: 1,
    inhale: 1.55,
    hold: 1.55,
    exhale: 0.9,
    rest: 0.9,
    done: 1,
  };

  const orbDuration: Record<Phase, number> = {
    intro: 400,
    inhale: CYCLE_MS.inhale,
    hold: CYCLE_MS.hold,
    exhale: CYCLE_MS.exhale,
    rest: CYCLE_MS.rest,
    done: 400,
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 animate-in fade-in duration-300"
      style={{ zIndex: 60, background: "rgba(0,0,0,0.7)" }}
    >
      <div className="w-full max-w-sm text-center space-y-6">
        <p className="text-sm font-rpg" style={{ color: "rgba(255,255,255,0.7)" }}>
          {phaseLabel[phase]}
        </p>

        <div className="flex items-center justify-center">
          <div
            className="rounded-full"
            style={{
              width: "160px",
              height: "160px",
              background:
                "radial-gradient(circle, rgba(232,213,181,0.35), rgba(192,163,116,0.12))",
              boxShadow: "0 0 40px rgba(232,213,181,0.25), inset 0 0 30px rgba(232,213,181,0.15)",
              transform: `scale(${orbScale[phase]})`,
              transition: `transform ${orbDuration[phase]}ms cubic-bezier(0.4, 0, 0.2, 1)`,
            }}
          />
        </div>

        <p
          className="text-[10px] font-rpg-sm"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          {phase === "intro"
            ? "3번 숨을 나눠 쉴게"
            : phase === "done"
              ? ""
              : `${cycleIdx + 1} / ${CYCLES}`}
        </p>

        <div className="flex gap-2 justify-center">
          {phase === "intro" && (
            <>
              <button
                onClick={() => setPhase("inhale")}
                className="glass-btn py-2.5 px-5 text-sm font-rpg"
                style={{ color: "rgba(255,255,255,0.85)" }}
              >
                🌬️ 시작
              </button>
              <button
                onClick={() => onClose(false)}
                className="py-2.5 px-4 text-xs font-rpg-sm transition-opacity hover:opacity-80"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                그만둘래
              </button>
            </>
          )}
          {phase === "done" && (
            <button
              onClick={() => onClose(true)}
              className="glass-btn py-2.5 px-5 text-sm font-rpg"
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              돌아갈게
            </button>
          )}
          {phase !== "intro" && phase !== "done" && (
            <button
              onClick={() => onClose(false)}
              className="py-2 text-[10px] font-rpg-sm transition-opacity hover:opacity-80"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              중단
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
