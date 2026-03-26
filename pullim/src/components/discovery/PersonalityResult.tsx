"use client";

import { useState } from "react";
import type { PersonalityType } from "@/lib/personalization/personality-type";
import type { ProbabilityProfile } from "@/lib/personalization/probability-profile";
import type { ThemeType } from "@/lib/personalization/story-scenes";
import FeedbackForm from "./FeedbackForm";

interface Props {
  type: PersonalityType;
  profile: ProbabilityProfile;
  theme: ThemeType;
  primaryColor: string;
  onContinue: () => void;
}

export default function PersonalityResult({ type, primaryColor, onContinue }: Props) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  async function handleShare() {
    await navigator.share({
      title: `나는 "${type.name}" 유형이래!`,
      text: `풀림에서 3분만에 알아낸 나의 유형: ${type.name}. ${type.description}`,
      url: window.location.href,
    });
  }

  return (
    <div className="w-full max-w-sm space-y-5 animate-in fade-in duration-700">
      {/* 유형 헤더 */}
      <div className="text-center space-y-3 pt-4">
        <div
          className="text-6xl leading-none"
          style={{ filter: `drop-shadow(0 0 24px ${primaryColor}99)` }}
        >
          {type.emoji}
        </div>
        <p
          className="text-xs font-rpg-sm tracking-widest uppercase"
          style={{ color: `${primaryColor}99` }}
        >
          당신의 유형
        </p>
        <h2
          className="text-2xl font-bold font-rpg-lg"
          style={{
            color: primaryColor,
            textShadow: `0 0 20px ${primaryColor}55, 0 0 40px ${primaryColor}22`,
          }}
        >
          {type.name}
        </h2>
      </div>

      {/* 구분선 */}
      <div
        className="h-px w-16 mx-auto"
        style={{ background: `linear-gradient(90deg, transparent, ${primaryColor}55, transparent)` }}
      />

      {/* 공유 버튼 */}
      <div className="flex items-center justify-center gap-2">
        {canShare && (
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-rpg-sm transition-all active:scale-95"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: `1px solid ${primaryColor}30`,
              color: `${primaryColor}99`,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            공유하기
          </button>
        )}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-rpg-sm transition-all active:scale-95"
          style={{
            background: copied ? `${primaryColor}18` : "rgba(255,255,255,0.05)",
            border: `1px solid ${copied ? primaryColor + "55" : "rgba(255,255,255,0.1)"}`,
            color: copied ? primaryColor : "rgba(192,167,136,0.6)",
          }}
        >
          {copied ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              복사됨!
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              링크 복사
            </>
          )}
        </button>
      </div>

      {/* 설명 */}
      <div
        className="rounded-2xl px-5 py-4 text-sm leading-relaxed font-rpg"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "var(--fantasy-text)",
        }}
      >
        {type.description}
      </div>

      {/* 풀림 대화 미리보기 */}
      <div
        className="rounded-2xl px-5 py-4 space-y-3"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <p
          className="text-xs font-rpg-sm"
          style={{ color: "rgba(192,167,136,0.45)" }}
        >
          풀림이라면 이렇게 대화했을 거예요
        </p>
        <div className="space-y-2">
          {type.pullimConversation.map((turn, i) => (
            <div
              key={i}
              className={`flex ${turn.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className="max-w-[82%] px-4 py-2.5 text-sm font-rpg leading-relaxed"
                style={
                  turn.role === "pullim"
                    ? {
                        background: `linear-gradient(135deg, ${primaryColor}18, ${primaryColor}0a)`,
                        border: `1px solid ${primaryColor}30`,
                        color: "var(--fantasy-text)",
                        borderRadius: "16px 16px 16px 4px",
                      }
                    : {
                        background: "rgba(255,255,255,0.07)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "rgba(192,167,136,0.8)",
                        borderRadius: "16px 16px 4px 16px",
                      }
                }
              >
                {turn.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 강점 / 놓치기 쉬운 것 - 아코디언 */}
      <div className="space-y-2">
        <button
          onClick={() => setShowDetails((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3 rounded-xl text-sm font-rpg transition-all active:scale-[0.99]"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            color: "rgba(192,167,136,0.55)",
          }}
        >
          <span>강점 &amp; 놓치기 쉬운 것</span>
          <span className="text-xs">{showDetails ? "▲" : "▼"}</span>
        </button>

        {showDetails && (
          <div className="space-y-2 animate-in fade-in duration-300">
            <div
              className="rounded-xl px-5 py-4 space-y-2"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p
                className="text-xs font-rpg-sm"
                style={{ color: `${primaryColor}cc` }}
              >
                ✦ 강점
              </p>
              <ul className="space-y-1.5">
                {type.strengths.map((s, i) => (
                  <li
                    key={i}
                    className="text-sm font-rpg flex items-start gap-2"
                    style={{ color: "var(--fantasy-text)" }}
                  >
                    <span style={{ color: primaryColor, flexShrink: 0 }}>·</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <div
              className="rounded-xl px-5 py-4 space-y-2"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p
                className="text-xs font-rpg-sm"
                style={{ color: "rgba(192,167,136,0.5)" }}
              >
                ⚠ 놓치기 쉬운 것
              </p>
              <ul className="space-y-1.5">
                {type.blindSpots.map((b, i) => (
                  <li
                    key={i}
                    className="text-sm font-rpg flex items-start gap-2"
                    style={{ color: "rgba(192,167,136,0.7)" }}
                  >
                    <span style={{ color: "rgba(192,167,136,0.4)", flexShrink: 0 }}>·</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* 피드백 폼 */}
      <FeedbackForm personalityType={type.name} />

      {/* CTA */}
      <div className="space-y-3 pb-6">
        <button
          onClick={onContinue}
          className="w-full py-4 px-5 rounded-2xl text-sm font-medium font-rpg transition-all active:scale-[0.98]"
          style={{
            background:
              "linear-gradient(145deg, var(--fantasy-leather), var(--fantasy-leather-deep))",
            border: "1px solid var(--fantasy-gold-dark)",
            color: "var(--fantasy-button-text)",
            boxShadow:
              "0 2px 0 var(--fantasy-leather-darkest), 0 3px 8px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)",
            textShadow: "0 1px 0 var(--fantasy-leather-darkest)",
          }}
        >
          대화 시작하기
        </button>
      </div>
    </div>
  );
}
