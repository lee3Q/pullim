"use client";

import { useState } from "react";
import Link from "next/link";
import { ConclusionData, ActionCommitment } from "@/lib/types-ultimate";

interface Props {
  conclusion: ConclusionData;
  tagline: string;
  farewell: string;
  primaryColor: string;
  onCommit: (commitment: ActionCommitment) => void;
}

const DEADLINE_OPTIONS = [
  { label: "내일", days: 1 },
  { label: "다음 주", days: 7 },
  { label: "2주 후", days: 14 },
];

export default function ConclusionView({ conclusion, tagline, farewell, primaryColor, onCommit }: Props) {
  const [phase, setPhase] = useState<"summary" | "decide" | "action" | "deadline" | "done">("summary");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const handleDecide = (knows: boolean) => {
    if (knows) {
      setPhase("action");
    } else {
      setPhase("done");
    }
  };

  const handleSelectAction = (index: number) => {
    setSelectedOption(index);
    setPhase("deadline");
  };

  const handleSelectDeadline = (days: number) => {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + days);
    const deadlineStr = deadline.toISOString().split("T")[0];

    onCommit({
      action: conclusion.options[selectedOption!]?.direction ?? "",
      deadline: deadlineStr,
      nextSessionDate: deadlineStr,
    });

    setPhase("done");
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-md mx-auto">
      {/* 요약 카드 — RPG 패널 */}
      <div className="rpg-panel px-4 py-4">
        <p className="text-xs text-white/40 mb-2 font-rpg-sm">세션 요약</p>
        <p className="text-sm text-white/70 leading-relaxed">{conclusion.situationSummary}</p>
        {conclusion.keyCrossroad && (
          <p className="text-xs mt-3 font-rpg" style={{ color: primaryColor }}>
            핵심 갈림길: {conclusion.keyCrossroad}
          </p>
        )}
      </div>

      {/* 선택지 */}
      {phase === "summary" && (
        <>
          <div className="flex gap-3">
            {conclusion.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleSelectAction(i)}
                className="flex-1 rpg-panel-light px-3 py-3 text-left transition-all hover:border-white/20 cursor-pointer"
              >
                <p className="text-sm font-rpg text-white/80">{opt.direction}</p>
                <p className="text-[11px] text-white/40 mt-1 font-rpg-sm">리스크: {opt.risk}</p>
                <p className="text-[11px] text-white/40 font-rpg-sm">보상: {opt.reward}</p>
              </button>
            ))}
          </div>

          {/* 핵심 대사 */}
          <p className="text-center text-sm text-white/60 italic mt-2 font-rpg">
            &ldquo;{tagline}&rdquo;
          </p>

          {/* 선택 */}
          <div className="flex gap-3 justify-center mt-2">
            <button
              onClick={() => handleDecide(false)}
              className="rpg-button-ghost px-4 py-2 text-xs"
            >
              잘 모르겠어요...
            </button>
            <button
              onClick={() => handleDecide(true)}
              className="rpg-button px-4 py-2 text-xs"
            >
              사실, 맞아요
            </button>
          </div>
        </>
      )}

      {/* 행동 선택 */}
      {phase === "action" && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-white/40 mb-1 font-rpg-sm">어떤 걸 해보시겠어요?</p>
          {conclusion.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleSelectAction(i)}
              className="w-full text-left rpg-panel-light px-4 py-3 text-sm text-white/70 font-rpg transition-all hover:border-white/20"
            >
              {opt.direction}
            </button>
          ))}
        </div>
      )}

      {/* 기한 선택 */}
      {phase === "deadline" && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-white/40 mb-1 font-rpg-sm">언제까지 해보시겠어요?</p>
          <div className="flex gap-2">
            {DEADLINE_OPTIONS.map((opt) => (
              <button
                key={opt.days}
                onClick={() => handleSelectDeadline(opt.days)}
                className="flex-1 rpg-button-ghost px-3 py-2 text-xs"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 완료 */}
      {phase === "done" && (
        <>
          <p className="text-center text-sm text-white/50 italic font-rpg">
            &ldquo;{farewell}&rdquo;
          </p>
          <div className="flex gap-3 justify-center mt-4">
            <Link href="/" className="rpg-button-ghost px-4 py-2 text-xs font-rpg-sm">새 고민 시작하기</Link>
            <a href="/history" className="rpg-button-ghost px-4 py-2 text-xs font-rpg-sm">내 기록 보기</a>
          </div>
        </>
      )}
    </div>
  );
}
