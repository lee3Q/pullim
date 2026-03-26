"use client";

import { useState, useRef, useCallback } from "react";
import {
  ADVENTURE_QUESTIONS,
  buildProfile,
  type SelectionRecord,
  type UserProfile,
  type DiscoveryQuestion,
} from "@/lib/personalization/discovery-engine";
import DiscoveryChoice from "./DiscoveryChoice";

interface Props {
  onComplete: (profile: UserProfile) => void;
  primaryColor: string;
}

export default function DiscoveryGame({ onComplete, primaryColor }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<"intro" | "playing" | "done">("intro");
  const [fadeOut, setFadeOut] = useState(false);
  const selections = useRef<SelectionRecord[]>([]);
  const questionShownAt = useRef<number>(Date.now());

  const questions = ADVENTURE_QUESTIONS;
  const currentQuestion: DiscoveryQuestion | undefined = questions[currentIndex];

  const handleIntroStart = useCallback(() => {
    setPhase("playing");
    questionShownAt.current = Date.now();
  }, []);

  const handleSelect = useCallback(
    (index: 0 | 1) => {
      if (!currentQuestion) return;

      const timeMs = Date.now() - questionShownAt.current;
      const option = currentQuestion.options[index];

      selections.current.push({
        questionId: currentQuestion.id,
        selectedValue: option.value,
        axis: option.axis,
        timeMs,
      });

      // 페이드아웃 → 다음 질문 or 완료
      setFadeOut(true);
      setTimeout(() => {
        setFadeOut(false);
        if (currentIndex + 1 < questions.length) {
          setCurrentIndex(currentIndex + 1);
          questionShownAt.current = Date.now();
        } else {
          setPhase("done");
          const profile = buildProfile(selections.current);
          onComplete(profile);
        }
      }, 300);
    },
    [currentQuestion, currentIndex, questions.length, onComplete]
  );

  // 인트로
  if (phase === "intro") {
    return (
      <div
        className="flex flex-col items-center gap-6 py-8"
        style={{ animation: "stage-fade-in 0.6s ease-out" }}
      >
        <p
          className="text-sm font-rpg text-center leading-relaxed"
          style={{ color: `${primaryColor}cc` }}
        >
          잠깐, 자네를 알아가는 시간을 갖겠네.
          <br />
          어렵게 생각하지 말게. 직감으로 골라주게.
        </p>
        <button
          onClick={handleIntroStart}
          className="rpg-button px-6 py-2.5 text-sm font-rpg"
        >
          시작
        </button>
      </div>
    );
  }

  // 완료 (실제로 UI에 결과를 보여주지 않음 — 내부 처리)
  if (phase === "done") {
    return (
      <div
        className="flex flex-col items-center gap-4 py-8"
        style={{ animation: "stage-fade-in 0.4s ease-out" }}
      >
        <p
          className="text-sm font-rpg"
          style={{ color: `${primaryColor}cc` }}
        >
          좋네... 자네가 어떤 사람인지 조금 보이기 시작했네.
        </p>
      </div>
    );
  }

  // 게임 진행 중
  return (
    <div
      className="flex flex-col gap-6 py-4"
      style={{
        opacity: fadeOut ? 0 : 1,
        transition: "opacity 0.3s ease",
      }}
    >
      {/* 진행률 */}
      <div className="flex justify-center gap-1.5">
        {questions.map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full transition-all duration-300"
            style={{
              background:
                i < currentIndex
                  ? primaryColor
                  : i === currentIndex
                  ? `${primaryColor}80`
                  : "rgba(255,255,255,0.15)",
              transform: i === currentIndex ? "scale(1.3)" : "scale(1)",
            }}
          />
        ))}
      </div>

      {/* 질문 */}
      {currentQuestion && (
        <>
          <p
            className="text-sm font-rpg text-center"
            style={{
              color: "rgba(255,255,255,0.85)",
              textShadow: "0 1px 6px rgba(0,0,0,0.7)",
              animation: "stage-fade-in 0.4s ease-out",
            }}
          >
            {currentQuestion.prompt}
          </p>

          <DiscoveryChoice
            options={currentQuestion.options}
            onSelect={handleSelect}
            primaryColor={primaryColor}
          />
        </>
      )}
    </div>
  );
}
