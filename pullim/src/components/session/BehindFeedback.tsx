"use client";

import { useState } from "react";
import { recordBehindFeedback, type FeedbackKind } from "@/lib/session/behind-feedback-store";
import { updateStoredProfile } from "@/lib/personalization/profile-storage";
import { updateProfileFromBehindEvent } from "@/lib/personalization/probability-profile";

interface BehindFeedbackProps {
  sessionId: string;
  inferenceSnapshot: string;
  onClose: () => void;
}

type Step = "ask" | "which" | "custom" | "thanks";

export default function BehindFeedback({
  sessionId,
  inferenceSnapshot,
  onClose,
}: BehindFeedbackProps) {
  const [step, setStep] = useState<Step>("ask");
  const [note, setNote] = useState("");

  function save(kind: FeedbackKind, customNote?: string) {
    recordBehindFeedback({
      sessionId,
      inferenceSnapshot,
      kind,
      note: customNote,
    });
    // 프로필 학습 연결
    if (kind === "confirm") {
      updateStoredProfile((p) => updateProfileFromBehindEvent(p, "feedback_confirm"));
    } else if (kind === "misread_me" || kind === "wrong_info" || kind === "custom") {
      updateStoredProfile((p) => updateProfileFromBehindEvent(p, "feedback_misread"));
    }
    setStep("thanks");
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{ zIndex: 50, background: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
    >
      <div
        className="glass-panel max-w-sm w-full p-5 space-y-4 rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-1">
          <p
            className="text-xs font-rpg-sm"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            지금 풀림이 이렇게 파악했어
          </p>
          <p
            className="text-sm font-rpg leading-relaxed"
            style={{ color: "rgba(255,255,255,0.9)" }}
          >
            {inferenceSnapshot}
          </p>
        </div>

        <div
          className="h-px"
          style={{ background: "rgba(255,255,255,0.08)" }}
        />

        {step === "ask" && (
          <>
            <p
              className="text-sm font-rpg text-center"
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              이거 맞아?
            </p>
            <div className="space-y-2">
              <button
                onClick={() => save("confirm")}
                className="glass-btn w-full py-3 text-sm font-rpg"
                style={{ color: "rgba(255,255,255,0.85)" }}
              >
                ✓ 맞아
              </button>
              <button
                onClick={() => setStep("which")}
                className="glass-btn w-full py-3 text-sm font-rpg"
                style={{ color: "rgba(255,255,255,0.85)" }}
              >
                아닌데
              </button>
              <button
                onClick={() => setStep("custom")}
                className="w-full py-2 text-xs font-rpg-sm transition-opacity hover:opacity-80"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                직접 말할게
              </button>
            </div>
          </>
        )}

        {step === "which" && (
          <>
            <p
              className="text-sm font-rpg text-center"
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              어떤 부분이?
            </p>
            <div className="space-y-2">
              <button
                onClick={() => save("misread_me")}
                className="glass-btn w-full py-3 text-sm font-rpg text-left px-4"
                style={{ color: "rgba(255,255,255,0.85)" }}
              >
                나를 잘못 파악했어
              </button>
              <button
                onClick={() => save("wrong_info")}
                className="glass-btn w-full py-3 text-sm font-rpg text-left px-4"
                style={{ color: "rgba(255,255,255,0.85)" }}
              >
                잘못된 정보를 말하고 있어
              </button>
              <button
                onClick={() => setStep("custom")}
                className="w-full py-2 text-xs font-rpg-sm transition-opacity hover:opacity-80"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                직접 말할게
              </button>
            </div>
          </>
        )}

        {step === "custom" && (
          <>
            <p
              className="text-sm font-rpg"
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              뭐가 아닌지 말해줘
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="지금 풀림이 뭘 잘못 읽고 있어?"
              className="glass-input w-full p-3 text-sm font-rpg rounded-xl resize-none"
              style={{
                color: "rgba(255,255,255,0.9)",
                minHeight: "80px",
              }}
              autoFocus
              maxLength={240}
            />
            <div className="flex gap-2">
              <button
                onClick={() => save("custom", note.trim() || undefined)}
                disabled={note.trim().length === 0}
                className="glass-btn flex-1 py-3 text-sm font-rpg disabled:opacity-30"
                style={{ color: "rgba(255,255,255,0.85)" }}
              >
                보낼게
              </button>
              <button
                onClick={onClose}
                className="py-3 px-4 text-xs font-rpg-sm transition-opacity hover:opacity-80"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                그만둘래
              </button>
            </div>
          </>
        )}

        {step === "thanks" && (
          <div className="text-center space-y-2 py-4">
            <p className="text-2xl">🧭</p>
            <p
              className="text-sm font-rpg"
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              고마워, 다음에 반영할게
            </p>
            <button
              onClick={onClose}
              className="glass-btn w-full py-2.5 mt-3 text-sm font-rpg"
              style={{ color: "rgba(255,255,255,0.75)" }}
            >
              돌아가기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
