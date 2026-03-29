"use client";

import { useState, useMemo } from "react";
import { createPromise } from "@/lib/session/promise-store";

interface SessionSummaryProps {
  summary: string;
  theme: string;
  onClose: () => void;
  onBackToHome: () => void;
}

const PROMISE_EXAMPLES: Record<string, Array<{ trigger: string; action: string }>> = {
  "모험가": [
    { trigger: "길을 잃은 것 같을 때", action: "잠깐 멈추고 지금 느낌을 한 단어로 써볼래" },
    { trigger: "앞이 막막할 때", action: "지금 할 수 있는 가장 작은 한 걸음만 해볼래" },
    { trigger: "포기하고 싶을 때", action: "풀림 열고 지금 기분 하나만 털어볼래" },
  ],
  "달빛정원": [
    { trigger: "마음이 무거울 때", action: "창밖을 한 번만 바라봐볼래" },
    { trigger: "혼자인 게 너무 클 때", action: "이 감정에 이름을 붙여볼래" },
    { trigger: "잠이 안 올 때", action: "오늘 좋았던 것 하나만 떠올려볼래" },
  ],
  "전략실": [
    { trigger: "결정이 막막할 때", action: "선택지를 종이에 적어볼래" },
    { trigger: "일이 쌓여서 압박될 때", action: "지금 당장 할 수 있는 한 가지만 골라볼래" },
    { trigger: "집중이 안 될 때", action: "5분만 딴 거 다 끄고 이것만 해볼래" },
  ],
  "천문대": [
    { trigger: "모든 게 의미없어 보일 때", action: "오늘 새로운 것 하나만 찾아볼래" },
    { trigger: "자신이 작게 느껴질 때", action: "최근에 내가 잘 해낸 일을 하나만 써볼래" },
    { trigger: "미래가 불안할 때", action: "지금 내가 가진 것 세 가지를 떠올려볼래" },
  ],
  "종말": [
    { trigger: "모든 게 무너지는 것 같을 때", action: "지금 살아있다는 감각 하나만 느껴볼래" },
    { trigger: "아무것도 하기 싫을 때", action: "물 한 잔만 마셔볼래" },
    { trigger: "혼자라는 게 너무 클 때", action: "풀림 열어볼래" },
  ],
};

type PromiseState = "suggest" | "accepted" | "rejected";

export default function SessionSummary({
  summary,
  theme,
  onClose,
  onBackToHome,
}: SessionSummaryProps) {
  const examples = PROMISE_EXAMPLES[theme] ?? PROMISE_EXAMPLES["모험가"];
  const example = useMemo(
    () => examples[Math.floor(Math.random() * examples.length)],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [promiseState, setPromiseState] = useState<PromiseState>("suggest");

  function handleAccept() {
    createPromise(example.trigger, example.action, theme);
    setPromiseState("accepted");
  }

  function handleReject() {
    setPromiseState("rejected");
  }

  return (
    <div className="w-full max-w-sm md:max-w-lg lg:max-w-xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* 오늘의 정리 */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 space-y-4">
        <h3 className="text-sm font-medium text-white/60">오늘의 정리</h3>
        <p className="text-sm text-white/80 leading-relaxed whitespace-pre-line">
          {summary}
        </p>
      </div>

      {/* 약속 섹션 */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 space-y-4">
        {promiseState === "suggest" && (
          <>
            <div className="space-y-1">
              <h3
                className="text-sm font-medium"
                style={{ color: "var(--fantasy-gold)" }}
              >
                💫 하나만 약속해볼래?
              </h3>
              <p
                className="text-xs font-rpg-sm"
                style={{ color: "rgba(192,167,136,0.55)" }}
              >
                작은 실험이야. 틀려도 데이터
              </p>
            </div>

            <div
              className="rounded-xl p-4 space-y-2"
              style={{ background: "rgba(192,163,116,0.08)" }}
            >
              <p
                className="text-xs font-rpg-sm"
                style={{ color: "rgba(192,167,136,0.65)" }}
              >
                <span style={{ color: "var(--fantasy-gold-bright)" }}>만약</span>{" "}
                {example.trigger}
              </p>
              <p
                className="text-sm font-rpg"
                style={{ color: "var(--fantasy-text)" }}
              >
                → {example.action}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAccept}
                className="flex-1 py-3 rounded-xl text-sm font-rpg transition-all active:scale-95"
                style={{
                  background: "rgba(192,163,116,0.15)",
                  color: "var(--fantasy-gold-bright)",
                  border: "1px solid rgba(192,163,116,0.3)",
                }}
              >
                약속할게
              </button>
              <button
                onClick={handleReject}
                className="flex-1 py-3 rounded-xl text-sm font-rpg transition-all active:scale-95"
                style={{
                  color: "rgba(192,167,136,0.45)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                다음에
              </button>
            </div>
          </>
        )}

        {promiseState === "accepted" && (
          <div className="text-center space-y-2 py-2">
            <p className="text-2xl">💫</p>
            <p
              className="text-sm font-rpg"
              style={{ color: "var(--fantasy-text)" }}
            >
              기억해뒀어. 다음에 확인할게.
            </p>
            <p
              className="text-xs font-rpg-sm"
              style={{ color: "rgba(192,167,136,0.5)" }}
            >
              풀림이 옆에 있을게
            </p>
          </div>
        )}

        {promiseState === "rejected" && (
          <div className="text-center space-y-2 py-2">
            <p
              className="text-sm font-rpg"
              style={{ color: "var(--fantasy-text)" }}
            >
              괜찮아, 다음에 해도 돼 🌙
            </p>
            <p
              className="text-xs font-rpg-sm"
              style={{ color: "rgba(192,167,136,0.5)" }}
            >
              오늘 이야기 나눈 것만으로도 충분해
            </p>
          </div>
        )}
      </div>

      {/* 하단 버튼 */}
      <div className="space-y-3">
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl text-sm text-white/40 hover:text-white/60 border border-white/10 hover:border-white/20 transition-all"
        >
          계속 이야기하기
        </button>
        <button
          onClick={onBackToHome}
          className="w-full py-3 text-center text-xs text-white/25 hover:text-white/40 transition-colors"
        >
          오늘은 여기까지
        </button>
      </div>
    </div>
  );
}
