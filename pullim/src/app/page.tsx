"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { nanoid } from "nanoid";
import { ThemeName } from "@/lib/types-ultimate";
import { THEMES } from "@/lib/themes";
import type { ThemeType } from "@/lib/personalization/story-scenes";
import type { ProbabilityProfile } from "@/lib/personalization/probability-profile";
import type { StorySelectionRecord } from "@/lib/personalization/discovery-engine";
import { getPersonalityType } from "@/lib/personalization/personality-type";
import type { PersonalityType } from "@/lib/personalization/personality-type";
import ThemeSelector from "@/components/ultimate/ThemeSelector";
import dynamic from "next/dynamic";
const StoryDiscovery = dynamic(() => import("@/components/discovery/StoryDiscovery"));
const PersonalityResult = dynamic(() => import("@/components/discovery/PersonalityResult"));
import CrisisAlert from "@/components/CrisisAlert";
import { useSettings } from "@/hooks/useSettings";

// ThemeType ↔ ThemeName 매핑
const THEME_TO_NAME: Record<ThemeType, ThemeName> = {
  garden: "달빛정원",
  adventure: "모험가",
  strategy: "전략실",
};

const THEME_COLORS: Record<ThemeType, string> = {
  garden: "#a78bfa",
  adventure: "#ff9f1c",
  strategy: "#60a5fa",
};

// 기분 → 테마 추천
const MOOD_OPTIONS: {
  emoji: string;
  label: string;
  sub: string;
  theme: ThemeType | null;
  entry: "concern" | "bored" | "curious";
  color: string;
}[] = [
  {
    emoji: "🌙",
    label: "위로받고 싶어",
    sub: "마음이 좀 무거워",
    theme: "garden",
    entry: "concern",
    color: "#a78bfa",
  },
  {
    emoji: "🎯",
    label: "정리하고 싶어",
    sub: "머리가 복잡해",
    theme: "strategy",
    entry: "concern",
    color: "#60a5fa",
  },
  {
    emoji: "🌀",
    label: "모르겠어",
    sub: "그냥 뭔가...",
    theme: "adventure",
    entry: "curious",
    color: "#ff9f1c",
  },
  {
    emoji: "💬",
    label: "고민이 있어",
    sub: "이야기하고 싶은 게 있어",
    theme: null,
    entry: "concern",
    color: "#e0e0e0",
  },
  {
    emoji: "✨",
    label: "심심해",
    sub: "재미있는 거 없나",
    theme: "adventure",
    entry: "bored",
    color: "#ff9f1c",
  },
];

type Phase = "mood" | "discover" | "result" | "discover-done" | "session-entry";

export default function HomePage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("mood");
  const [selectedTheme, setSelectedTheme] = useState<ThemeType>("garden");
  const [selectedEntry, setSelectedEntry] = useState<"concern" | "bored" | "curious">("concern");
  const [personalityType, setPersonalityType] = useState<PersonalityType | null>(null);
  const [savedProfile, setSavedProfile] = useState<ProbabilityProfile | null>(null);
  const [crisis, setCrisis] = useState<{
    message: string;
    hotline: string;
  } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const { settings, update: updateSettings } = useSettings();

  const primaryColor = THEME_COLORS[selectedTheme];

  const handleMoodSelect = (mood: (typeof MOOD_OPTIONS)[number]) => {
    setSelectedEntry(mood.entry);
    if (mood.theme === null) {
      // "고민이 있어" → 테마 선택 후 파악
      setPhase("session-entry");
    } else {
      setSelectedTheme(mood.theme);
      // 모든 경로가 파악을 거친다. 건너뛰기 선택도 데이터.
      setPhase("discover");
    }
  };

  const handleDiscoveryComplete = useCallback(
    (profile: ProbabilityProfile, selections: StorySelectionRecord[]) => {
      try {
        localStorage.setItem("pullim_user_profile", JSON.stringify({ profile, sessionCount: 0, lastSessionAt: new Date().toISOString(), lastSatisfaction: null, completedSessions: 0 }));
        localStorage.setItem("pullim_discovery", JSON.stringify(selections));
      } catch {
        // localStorage 실패 무시
      }

      // Supabase 저장 (fire-and-forget)
      const userId =
        localStorage.getItem("pullim_user_id") || nanoid(12);
      localStorage.setItem("pullim_user_id", userId);

      fetch("/api/discovery-selections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          theme: selectedTheme,
          selections,
          profile,
        }),
      }).catch(() => {});

      const type = getPersonalityType(profile);
      setPersonalityType(type);
      setSavedProfile(profile);
      setPhase("result");
    },
    [selectedTheme]
  );

  const [isNavigating, setIsNavigating] = useState(false);

  const handleStartSession = (themeName: ThemeName, entry: "concern" | "bored" | "curious" = "concern") => {
    setIsNavigating(true);
    const sessionId = nanoid(12);
    const route = THEMES[themeName].route;
    router.push(`${route}/${sessionId}?theme=${themeName}&mode=ladder&entry=${entry}`);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col relative overflow-x-hidden">
      {crisis && (
        <CrisisAlert
          message={crisis.message}
          hotline={crisis.hotline}
          onClose={() => setCrisis(null)}
        />
      )}

      {/* 배경 */}
      <div
        className="fixed inset-0 -z-10 overflow-hidden"
        style={{ height: "100dvh" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#12101a] via-[#1a1530] to-[#1e1a28]" />
        <div className="absolute inset-0 opacity-50">
          <Image
            src="/assets/home-bg.webp"
            alt=""
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />
      </div>

      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center relative z-10">
        <button
          onClick={() => setPhase("mood")}
          className="text-lg font-bold font-rpg-lg"
          style={{ color: "var(--fantasy-gold-bright)", textShadow: "0 0 12px rgba(192,163,116,0.3)" }}
        >
          풀림
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSettings((v) => !v)}
            className="text-sm text-white/60 hover:text-white/80 transition-colors p-2"
            aria-label="설정"
          >
            &#9881;
          </button>
          <button
            onClick={() => router.push("/history")}
            className="text-sm text-white/60 hover:text-white/80 transition-colors font-rpg-sm p-2"
          >
            내 기록
          </button>
        </div>
      </header>

      {/* Settings dropdown */}
      {showSettings && (
        <div className="mx-6 mt-1 rounded-xl border border-white/10 bg-black/60 backdrop-blur-md px-4 py-3 relative z-20 animate-in fade-in duration-200">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs text-white/60">선택지 추천 표시</span>
            <button
              onClick={() =>
                updateSettings({
                  showRecommendations: !settings.showRecommendations,
                })
              }
              className="relative w-10 h-5 rounded-full transition-colors"
              style={{
                background: settings.showRecommendations
                  ? "#a78bfa"
                  : "rgba(255,255,255,0.15)",
              }}
            >
              <span
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                style={{
                  left: settings.showRecommendations ? "calc(100% - 18px)" : "2px",
                }}
              />
            </button>
          </label>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20 relative z-10">
        {/* ── 기분 선택 ── */}
        {phase === "mood" && (
          <div className="w-full max-w-sm space-y-8 animate-in fade-in duration-500">
            {/* 데모 유도 카피 */}
            <div className="text-center space-y-2 pt-2">
              <h2
                className="text-2xl font-bold leading-snug font-rpg-lg"
                style={{
                  background: "linear-gradient(135deg, #c0a374 0%, #a78bfa 55%, #93c5fd 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  filter: "drop-shadow(0 0 16px rgba(167,139,250,0.45))",
                }}
              >
                3분이면 나를 알 수 있어요
              </h2>
              <p
                className="text-sm leading-relaxed font-rpg-sm"
                style={{ color: "rgba(192,167,136,0.6)" }}
              >
                10가지 장면에서 선택하면,<br />AI가 당신의 유형을 읽어냅니다
              </p>
            </div>

            <div className="text-center">
              <h1
                className="text-xl font-bold mb-2 font-rpg-lg"
                style={{
                  color: "var(--fantasy-gold-bright)",
                  textShadow: "0 0 20px rgba(192,163,116,0.4), 0 0 40px rgba(192,163,116,0.15)",
                }}
              >
                오늘 어떤 마음이야?
              </h1>
              <p className="text-sm font-rpg-sm" style={{ color: "rgba(192,167,136,0.70)" }}>편하게 골라봐</p>
            </div>

            <div className="space-y-3">
              {MOOD_OPTIONS.map((mood) => (
                <button
                  key={mood.label}
                  onClick={() => handleMoodSelect(mood)}
                  className="rpg-panel-light w-full text-left py-4 px-5 rounded-2xl transition-all
                             hover:scale-[1.01] active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{mood.emoji}</span>
                    <div>
                      <p className="text-sm font-medium font-rpg" style={{ color: "var(--fantasy-text)" }}>
                        {mood.label}
                      </p>
                      <p className="text-xs mt-0.5 font-rpg-sm" style={{ color: "rgba(192,167,136,0.45)" }}>{mood.sub}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── 스토리 파악 ── */}
        {phase === "discover" && (
          <div className="w-full max-w-sm animate-in fade-in duration-500">
            <StoryDiscovery
              theme={selectedTheme}
              userName=""
              speechStyle="casual"
              primaryColor={primaryColor}
              showRecommendations={settings.showRecommendations}
              onComplete={handleDiscoveryComplete}
            />
          </div>
        )}

        {/* ── 유형 결과 ── */}
        {phase === "result" && personalityType && savedProfile && (
          <div className="w-full max-w-sm animate-in fade-in duration-500">
            <PersonalityResult
              type={personalityType}
              profile={savedProfile}
              theme={selectedTheme}
              primaryColor={primaryColor}
              onContinue={() =>
                handleStartSession(THEME_TO_NAME[selectedTheme], selectedEntry)
              }
            />
          </div>
        )}

        {/* ── 파악 완료 (fallback) ── */}
        {phase === "discover-done" && (
          <div className="w-full max-w-sm space-y-6 animate-in fade-in duration-500">
            <div className="text-center space-y-2">
              <p className="text-sm leading-relaxed font-rpg" style={{ color: "var(--fantasy-text)" }}>
                너에 대해 조금 알게 된 것 같아.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() =>
                  handleStartSession(THEME_TO_NAME[selectedTheme], selectedEntry)
                }
                className="w-full py-4 px-5 rounded-2xl text-sm font-medium font-rpg transition-all active:scale-[0.98]"
                style={{
                  background: "linear-gradient(145deg, var(--fantasy-leather), var(--fantasy-leather-deep))",
                  border: "1px solid var(--fantasy-gold-dark)",
                  color: "var(--fantasy-button-text)",
                  boxShadow: "0 2px 0 var(--fantasy-leather-darkest), 0 3px 8px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)",
                  textShadow: "0 1px 0 var(--fantasy-leather-darkest)",
                }}
              >
                고민도 풀어볼래?
              </button>
              <button
                onClick={() => setPhase("mood")}
                className="w-full py-3 text-center text-sm font-rpg-sm transition-colors"
                style={{ color: "rgba(192,163,116,0.4)" }}
              >
                오늘은 여기까지
              </button>
            </div>
          </div>
        )}

        {/* ── 세션 진입 (고민이 있어) ── */}
        {phase === "session-entry" && (
          <div className="w-full max-w-sm space-y-6 animate-in fade-in duration-500">
            <div className="text-center">
              <h2
                className="text-lg font-bold mb-2 font-rpg-lg"
                style={{ color: "var(--fantasy-gold-bright)", textShadow: "0 0 20px rgba(192,163,116,0.3)" }}
              >
                어디서 이야기할까?
              </h2>
              <p className="text-sm font-rpg-sm" style={{ color: "rgba(192,167,136,0.5)" }}>분위기를 골라봐</p>
            </div>

            <ThemeSelector onSelect={(themeName) => {
              // 테마 선택 후 파악으로 이동 (모든 경로가 파악을 거친다)
              const themeKey = Object.entries(THEME_TO_NAME).find(([, v]) => v === themeName)?.[0] as ThemeType | undefined;
              if (themeKey) {
                setSelectedTheme(themeKey);
                setPhase("discover");
              }
            }} disabled={false} />

            <button
              onClick={() => setPhase("mood")}
              className="w-full text-center text-xs font-rpg-sm transition-colors pt-2"
              style={{ color: "rgba(192,163,116,0.35)" }}
            >
              ← 돌아가기
            </button>
          </div>
        )}
      </main>

      {/* 로딩 오버레이 */}
      {isNavigating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="text-center space-y-4 animate-in fade-in duration-300">
            <div className="flex gap-2 justify-center">
              <div className="w-2 h-2 rounded-full bg-white/40 animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-white/40 animate-pulse [animation-delay:200ms]" />
              <div className="w-2 h-2 rounded-full bg-white/40 animate-pulse [animation-delay:400ms]" />
            </div>
            <p className="text-sm text-white/40">준비하고 있어...</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center text-xs text-white/25 py-4 relative z-10">
        풀림은 전문 상담을 대체하지 않습니다. 위기 시{" "}
        <a href="tel:109" className="text-white/40 underline">
          109
        </a>
        로 연락하세요.
      </footer>
    </div>
  );
}
