"use client";

import { useState, useCallback } from "react";
import type { ProbabilityProfile } from "@/lib/personalization/probability-profile";
import type { ThemeType } from "@/lib/personalization/story-scenes";
import StoryDiscovery from "@/components/discovery/StoryDiscovery";

type Step = "welcome" | "speech" | "theme" | "discovery";

interface OnboardingFlowProps {
  onComplete: (profile: ProbabilityProfile) => void;
  primaryColor: string;
}

const THEME_OPTIONS = [
  { key: "adventure" as const, emoji: "🗡️", label: "모험가", desc: "희망도 패배도 있는 길" },
  { key: "garden" as const, emoji: "🌿", label: "정원", desc: "조용히 정리하는 곳" },
  { key: "strategy" as const, emoji: "🎯", label: "전략실", desc: "딱 부러지게 가는 곳" },
  { key: "stargazer" as const, emoji: "🔭", label: "천문대", desc: "방향을 모르겠을 때" },
];

export default function OnboardingFlow({ onComplete, primaryColor }: OnboardingFlowProps) {
  const [step, setStep] = useState<Step>("welcome");
  const [userName, setUserName] = useState("");
  const [speechStyle, setSpeechStyle] = useState<"casual" | "formal">("casual");
  const [selectedTheme, setSelectedTheme] = useState<ThemeType>("adventure");

  const handleNameSubmit = useCallback(() => {
    const name = userName.trim() || "여행자";
    setUserName(name);
    setStep("speech");
  }, [userName]);

  const handleSpeechSelect = useCallback((style: "casual" | "formal") => {
    setSpeechStyle(style);
    setStep("theme");
  }, []);

  const handleThemeSelect = useCallback((theme: ThemeType) => {
    setSelectedTheme(theme);
    setStep("discovery");
  }, []);

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* ─── Welcome ─── */}
      {step === "welcome" && (
        <div className="space-y-4">
          <div
            className="rounded-2xl p-5 space-y-3"
            style={{ background: `${primaryColor}15`, border: `1px solid ${primaryColor}30` }}
          >
            <p className="text-white/90 text-sm leading-relaxed">
              안녕하세요! 풀림에 오신 걸 환영해요.<br />
              같이 꼬인 것들을 풀어나가봐요.
            </p>
            <p className="text-white/70 text-sm">뭐라고 불러드릴까요?</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="이름 입력"
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/40"
                onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
                autoFocus
              />
              <button
                onClick={handleNameSubmit}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{ background: primaryColor, color: "white" }}
              >
                확인
              </button>
            </div>
            <p className="text-white/30 text-xs">추천: 여행자</p>
          </div>
        </div>
      )}

      {/* ─── Speech Style ─── */}
      {step === "speech" && (
        <div className="space-y-3">
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{ background: `${primaryColor}15`, border: `1px solid ${primaryColor}30` }}
          >
            <p className="text-white/90 text-sm">
              {userName}! 반가워요.
              <br />반말이 편해요, 존댓말이 편해요?
            </p>
            <div className="flex gap-3">
              {(["casual", "formal"] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => handleSpeechSelect(style)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium transition-all border"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    borderColor: `${primaryColor}40`,
                    color: "white",
                  }}
                >
                  {style === "casual" ? "반말" : "존댓말"}
                </button>
              ))}
            </div>
            <p className="text-white/30 text-xs">추천: 반말</p>
          </div>
        </div>
      )}

      {/* ─── Theme Select ─── */}
      {step === "theme" && (
        <div className="space-y-3">
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{ background: `${primaryColor}15`, border: `1px solid ${primaryColor}30` }}
          >
            <p className="text-white/90 text-sm">어떤 공간이 끌려{speechStyle === "formal" ? "요" : ""}?</p>
            <div className="space-y-2">
              {THEME_OPTIONS.map((t, i) => (
                <button
                  key={t.key}
                  onClick={() => handleThemeSelect(t.key)}
                  className="w-full py-3 px-4 rounded-xl text-sm text-left transition-all border flex items-center gap-3"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    borderColor: `${primaryColor}40`,
                    color: "white",
                  }}
                >
                  <span className="text-lg">{t.emoji}</span>
                  <div>
                    <span className="font-medium">{t.label}</span>
                    <span className="text-white/50 ml-2 text-xs">{t.desc}</span>
                  </div>
                  {i === 0 && (
                    <span
                      className="ml-auto text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: `${primaryColor}30`, color: primaryColor }}
                    >
                      추천
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Story Discovery ─── */}
      {step === "discovery" && (
        <StoryDiscovery
          theme={selectedTheme}
          userName={userName}
          speechStyle={speechStyle}
          primaryColor={primaryColor}
          onComplete={onComplete}
        />
      )}
    </div>
  );
}
