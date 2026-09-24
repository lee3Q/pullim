"use client";

import { useState, useCallback, useEffect } from "react";
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
import { getRecommendedTheme } from "@/lib/personalization/recommendation-engine";
// ThemeSelector no longer used on home — theme cards are inline
import dynamic from "next/dynamic";
const StoryDiscovery = dynamic(() => import("@/components/discovery/StoryDiscovery"));
const PersonalityResult = dynamic(() => import("@/components/discovery/PersonalityResult"));
import CrisisAlert from "@/components/CrisisAlert";
import AuthModal from "@/components/AuthModal";
import { useSettings } from "@/hooks/useSettings";
import { useBGM } from "@/hooks/useBGM";
import { useAuth } from "@/hooks/useAuth";

// ThemeType ↔ ThemeName 매핑
const THEME_TO_NAME: Record<ThemeType, ThemeName> = {
  garden: "달빛정원",
  adventure: "모험가",
  strategy: "전략실",
  stargazer: "천문대",
  apocalypse: "종말",
};

const THEME_COLORS: Record<ThemeType, string> = {
  garden: "#a78bfa",
  adventure: "#ff9f1c",
  strategy: "#60a5fa",
  stargazer: "#4338ca",
  apocalypse: "#f97316",
};

// 테마 카드 데이터
const THEME_CARDS: {
  key: ThemeType;
  emoji: string;
  name: string;
  desc: string;
  when: string;
  color: string;
  imagePath: string;
}[] = [
  {
    key: "garden",
    emoji: "🌿",
    name: "달빛정원",
    desc: "조용한 정원에서 감정을 천천히 들여다봐요",
    when: "마음이 무겁거나, 감정을 정리하고 싶을 때",
    color: "#a78bfa",
    imagePath: "/images/home/home_card_garden.png",
  },
  {
    key: "adventure",
    emoji: "🧙",
    name: "모험가의 숲",
    desc: "이야기 속 갈림길에서 직감을 따라가봐요",
    when: "뭘 해야 할지 모르겠거나, 방향을 찾고 싶을 때",
    color: "#ff9f1c",
    imagePath: "/images/home/home_card_adventure.png",
  },
  {
    key: "strategy",
    emoji: "🏙️",
    name: "전략실",
    desc: "데이터와 논리로 상황을 정리해봐요",
    when: "머리가 복잡하고, 논리적으로 따져보고 싶을 때",
    color: "#60a5fa",
    imagePath: "/images/home/home_card_strategy.png",
  },
  {
    key: "stargazer",
    emoji: "🔭",
    name: "천문대",
    desc: "별을 올려다보며 가능성을 찾아봐요",
    when: "방향을 모르겠거나, 가능성을 탐색하고 싶을 때",
    color: "#4338ca",
    imagePath: "/images/home/home_card_stargazer.png",
  },
  {
    key: "apocalypse",
    emoji: "☄️",
    name: "종말",
    desc: "세상이 끝난 뒤, 남은 것들을 마주해봐요",
    when: "극한 속에서 진짜 감정을 느끼고 싶을 때",
    color: "#f97316",
    imagePath: "/images/home/home_card_apocalypse.png",
  },
];

type Phase = "mood" | "discover" | "result" | "discover-done";

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
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { settings, update: updateSettings } = useSettings();
  const { user } = useAuth();

  // BGM — 선택된 테마의 트랙 재생
  const themeBgmTracks = THEMES[THEME_TO_NAME[selectedTheme]]?.assets?.bgmTracks;
  const { playing: bgmPlaying, toggle: toggleBGM } = useBGM(themeBgmTracks);

  const primaryColor = THEME_COLORS[selectedTheme];

  const [showThemeHelp, setShowThemeHelp] = useState(false);
  const [pickedTheme, setPickedTheme] = useState<ThemeType | null>(null);
  const [recommendedTheme, setRecommendedTheme] = useState<ThemeType | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem("pullim_user_profile");
        if (raw) {
          const parsed = JSON.parse(raw);
          const profile: ProbabilityProfile = parsed.profile ?? parsed;
          setRecommendedTheme(getRecommendedTheme(profile));
        }
      } catch {
        // 무시
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleThemeSelect = (themeKey: ThemeType, discover?: boolean) => {
    setSelectedTheme(themeKey);
    setSelectedEntry("concern");
    if (discover) {
      setPhase("discover");
      return;
    }
    handleStartSession(THEME_TO_NAME[themeKey], "concern");
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
            onClick={toggleBGM}
            className="text-sm text-white/60 hover:text-white/80 transition-colors p-3"
            aria-label="BGM 토글"
          >
            {bgmPlaying ? "🔊" : "🔇"}
          </button>
          <button
            onClick={() => setShowSettings((v) => !v)}
            className="text-sm text-white/60 hover:text-white/80 transition-colors p-3"
            aria-label="설정"
          >
            &#9881;
          </button>
          <button
            onClick={() => router.push("/history")}
            className="text-sm text-white/60 hover:text-white/80 transition-colors font-rpg-sm p-3"
          >
            내 기록
          </button>
          <button
            onClick={() => setShowAuthModal(true)}
            className="text-xs font-rpg-sm transition-colors px-3 py-1.5 rounded-lg"
            style={{
              background: "rgba(167,139,250,0.12)",
              border: "1px solid rgba(167,139,250,0.25)",
              color: user ? "#a78bfa" : "rgba(232,213,181,0.60)",
            }}
          >
            {user ? user.email.slice(0, 5) + "…" : "로그인"}
          </button>
        </div>
      </header>

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}

      {/* Settings dropdown */}
      {showSettings && (
        <div className="mx-6 mt-1 rounded-xl border border-white/25 bg-black/80 backdrop-blur-md px-4 py-3 relative z-20 animate-in fade-in duration-200">
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
          <label className="flex items-center justify-between cursor-pointer mt-3">
            <span className="text-xs text-white/60">매운맛 모드 🌶️</span>
            <button
              onClick={() =>
                updateSettings({
                  spicyMode: !settings.spicyMode,
                })
              }
              className="relative w-10 h-5 rounded-full transition-colors"
              style={{
                background: settings.spicyMode
                  ? "#ef4444"
                  : "rgba(255,255,255,0.15)",
              }}
            >
              <span
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                style={{
                  left: settings.spicyMode ? "calc(100% - 18px)" : "2px",
                }}
              />
            </button>
          </label>
          <label className="flex items-center justify-between cursor-pointer mt-3">
            <span className="text-xs text-white/60">💭 내면사고 보기</span>
            <button
              onClick={() =>
                updateSettings({
                  showBehindThoughts: !settings.showBehindThoughts,
                })
              }
              className="relative w-10 h-5 rounded-full transition-colors"
              style={{
                background: settings.showBehindThoughts
                  ? "#a78bfa"
                  : "rgba(255,255,255,0.15)",
              }}
            >
              <span
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                style={{
                  left: settings.showBehindThoughts ? "calc(100% - 18px)" : "2px",
                }}
              />
            </button>
          </label>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20 relative z-10">
        {/* ── 테마 선택 ── */}
        {phase === "mood" && (
          <div className="w-full max-w-sm md:max-w-lg lg:max-w-xl space-y-6 animate-in fade-in duration-500">
            <div className="text-center space-y-2 pt-2">
              <h1
                className="text-xl md:text-2xl font-bold font-rpg-lg"
                style={{
                  color: "var(--fantasy-gold-bright)",
                  textShadow: "0 0 20px rgba(192,163,116,0.4), 0 0 40px rgba(192,163,116,0.15)",
                }}
              >
                어떤 분위기에서 이야기할까?
              </h1>
              <p className="text-sm font-rpg-sm" style={{ color: "rgba(232,213,181,0.70)" }}>
                분위기를 골라봐. 탭하면 바로 대화가 시작돼.
              </p>
            </div>

            <div className="space-y-3">
              {THEME_CARDS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setPickedTheme(pickedTheme === t.key ? null : t.key)}
                  className="rpg-panel-light w-full text-left py-4 px-5 rounded-2xl transition-all
                             hover:scale-[1.01] active:scale-[0.98]"
                  style={{
                    outline: pickedTheme === t.key ? `2px solid ${t.color}` : "none",
                    outlineOffset: "-1px",
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                      <Image
                        src={t.imagePath}
                        alt={t.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold font-rpg" style={{ color: t.color }}>
                          {t.name}
                        </p>
                        {settings.showRecommendations && recommendedTheme === t.key && (
                          <span
                            className="text-[10px] font-rpg-sm px-1.5 py-0.5 rounded-full"
                            style={{
                              background: `${t.color}22`,
                              border: `1px solid ${t.color}66`,
                              color: t.color,
                            }}
                          >
                            ✦ 추천
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-1 font-rpg-sm leading-relaxed" style={{ color: "var(--fantasy-text)" }}>
                        {t.desc}
                      </p>
                      <p className="text-[11px] mt-1.5 font-rpg-sm" style={{ color: "rgba(232,213,181,0.60)" }}>
                        {t.when}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* 테마 선택 후 액션 버튼 */}
            {pickedTheme && (
              <div className="space-y-2 pt-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <button
                  onClick={() => handleThemeSelect(pickedTheme)}
                  className="w-full py-3.5 px-4 rounded-xl text-sm font-rpg transition-all active:scale-[0.97]"
                  style={{
                    background: `linear-gradient(145deg, ${THEME_COLORS[pickedTheme]}20, ${THEME_COLORS[pickedTheme]}08)`,
                    border: `1px solid ${THEME_COLORS[pickedTheme]}40`,
                    color: "rgba(232,213,181,0.90)",
                  }}
                >
                  바로 대화할래
                </button>
                <button
                  onClick={() => handleThemeSelect(pickedTheme, true)}
                  className="w-full py-3 px-4 rounded-xl text-xs font-rpg-sm transition-all active:scale-[0.97]"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    color: "rgba(232,213,181,0.65)",
                  }}
                >
                  🔮 먼저 파악해줘
                </button>
              </div>
            )}

            {/* 테마 미선택 시 안내 */}
            {!pickedTheme && (
              <p className="text-center text-[11px] font-rpg-sm pt-2" style={{ color: "rgba(232,213,181,0.35)" }}>
                분위기를 탭해서 골라봐
              </p>
            )}

            {/* 모르겠어 → 더 설명 / 파악 먼저 */}
            <div className="text-center space-y-1">
              <button
                onClick={() => setShowThemeHelp((v) => !v)}
                className="text-xs font-rpg-sm transition-colors py-3 px-2"
                style={{ color: "rgba(192,163,116,0.4)" }}
              >
                {showThemeHelp ? "접기 ▲" : "잘 모르겠어 — 더 알려줘 ▼"}
              </button>
            </div>

            {showThemeHelp && (
              <div
                className="rounded-2xl px-5 py-4 space-y-3 animate-in fade-in duration-300"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <p className="text-xs font-rpg-sm leading-relaxed" style={{ color: "rgba(232,213,181,0.8)" }}>
                  <strong style={{ color: "#a78bfa" }}>달빛정원</strong>은 감정에 집중해요. 위로받고 싶거나, 마음이 복잡할 때. 조용하고 따뜻한 톤.
                </p>
                <p className="text-xs font-rpg-sm leading-relaxed" style={{ color: "rgba(232,213,181,0.8)" }}>
                  <strong style={{ color: "#ff9f1c" }}>모험가의 숲</strong>은 직관에 집중해요. 뭘 원하는지 모르겠거나, 막막할 때. 이야기를 따라가다 보면 실마리가 보여요.
                </p>
                <p className="text-xs font-rpg-sm leading-relaxed" style={{ color: "rgba(232,213,181,0.8)" }}>
                  <strong style={{ color: "#60a5fa" }}>전략실</strong>은 논리에 집중해요. 선택지를 비교하거나, 체계적으로 정리하고 싶을 때. 데이터 기반.
                </p>
                <p className="text-xs font-rpg-sm leading-relaxed" style={{ color: "rgba(232,213,181,0.8)" }}>
                  <strong style={{ color: "#4338ca" }}>천문대</strong>는 가능성에 집중해요. 방향을 모르겠거나, 새로운 길을 찾고 싶을 때. 별처럼 가능성을 탐색해요.
                </p>
                <p className="text-[10px] font-rpg-sm mt-2" style={{ color: "rgba(232,213,181,0.50)" }}>
                  어떤 걸 골라도 대화 중에 분위기를 바꿀 수 있어요.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── 스토리 파악 ── */}
        {phase === "discover" && (
          <div className="w-full max-w-sm md:max-w-lg lg:max-w-xl animate-in fade-in duration-500">
            <StoryDiscovery
              theme={selectedTheme}
              userName=""
              speechStyle="casual"
              primaryColor={primaryColor}
              showRecommendations={settings.showRecommendations}
              spicyMode={settings.spicyMode}
              onComplete={handleDiscoveryComplete}
            />
            <button
              onClick={() => handleStartSession(THEME_TO_NAME[selectedTheme], selectedEntry)}
              className="w-full text-center text-xs font-rpg-sm transition-colors pt-4 pb-2"
              style={{ color: "rgba(232,213,181,0.60)" }}
            >
              건너뛰고 바로 대화하기 →
            </button>
          </div>
        )}

        {/* ── 유형 결과 ── */}
        {phase === "result" && personalityType && savedProfile && (
          <div className="w-full max-w-sm md:max-w-lg lg:max-w-xl animate-in fade-in duration-500">
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
          <div className="w-full max-w-sm md:max-w-lg lg:max-w-xl space-y-6 animate-in fade-in duration-500">
            <div className="text-center space-y-2">
              <p className="text-sm md:text-base leading-relaxed font-rpg" style={{ color: "var(--fantasy-text)" }}>
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

        {/* session-entry removed — theme selection is now on the home screen */}
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
            <p className="text-sm text-white/60">준비하고 있어...</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center text-xs text-white/25 py-4 relative z-10 space-y-1">
        <p>데이터는 기기에만 저장되며, 외부로 전송되지 않습니다.</p>
        <p>
          풀림은 전문 상담을 대체하지 않습니다. 위기 시{" "}
          <a href="tel:109" className="text-white/60 underline">
            109
          </a>
          로 연락하세요.
        </p>
      </footer>
    </div>
  );
}
