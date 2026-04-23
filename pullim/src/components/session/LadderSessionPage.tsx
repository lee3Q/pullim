"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { ThemeName } from "@/lib/types-ultimate";
import type { EntryMode } from "@/lib/session/ladder-types";
import { useUserProfile } from "@/hooks/useUserProfile";
import { buildSensoryLadderContext } from "@/lib/personalization/sensory-ladder";
import { THEMES } from "@/lib/themes";
import { useBGM } from "@/hooks/useBGM";
import LadderSession from "./LadderSession";
import CrisisAlert from "@/components/CrisisAlert";
import { useState, useCallback, useMemo } from "react";
import { getUnfinishedTrail, trailToPromptContext } from "@/lib/session/session-trail";

interface LadderSessionPageProps {
  theme: ThemeName;
  bgImage: string;
}

export default function LadderSessionPage({
  theme,
  bgImage,
}: LadderSessionPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const entryMode = (searchParams.get("entry") as EntryMode) || "concern";
  const { profile } = useUserProfile();
  const [crisis, setCrisis] = useState<{ message: string; hotline: string } | null>(null);

  // BGM
  const themeConfig = THEMES[theme];
  const { playing, trackLabel, toggle: toggleBGM, nextTrack } = useBGM(themeConfig?.assets?.bgmTracks);

  // 이어서 하기 (resume=1) — 미완 세션 맥락을 프롬프트에 주입
  const isResume = searchParams.get("resume") === "1";

  // 프로필 기반 개인화 컨텍스트 + (이어서 하기일 때) 직전 세션 맥락
  const profileContext = useMemo(() => {
    const baseContext = profile ? buildSensoryLadderContext(profile) : "";
    if (!isResume) return baseContext || undefined;
    const trail = getUnfinishedTrail();
    if (!trail) return baseContext || undefined;
    const trailContext = trailToPromptContext(trail);
    return [baseContext, trailContext].filter(Boolean).join("\n\n") || undefined;
  }, [profile, isResume]);

  // 테마 전환 핸들러
  const handleThemeChange = useCallback(
    (targetTheme: "모험가" | "전략실" | "달빛정원" | "천문대" | "종말") => {
      const themeRoutes: Record<string, string> = {
        "모험가": "/adventure",
        "전략실": "/strategy",
        "달빛정원": "/garden",
        "천문대": "/stargazer",
        "종말": "/apocalypse",
      };
      const route = themeRoutes[targetTheme] || "/adventure";
      router.push(`${route}/new?mode=ladder&entry=${entryMode}`);
    },
    [router, entryMode]
  );

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
      <div className="fixed inset-0 -z-10 overflow-hidden" style={{ height: "100dvh" }}>
        <div className="absolute inset-0 bg-gradient-to-b from-[#12101a] via-[#1a1530] to-[#1e1a28]" />
        <div className="absolute inset-0 opacity-40">
          <Image src={bgImage} alt="" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />
      </div>

      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center relative z-10">
        <Link href="/" className="text-lg font-bold text-white/80 font-rpg">
          풀림
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleBGM}
            className="text-xs text-white/50 hover:text-white/70 transition-colors p-2"
            aria-label="BGM 토글"
          >
            {playing ? "🔊" : "🔇"}
          </button>
          {playing && (
            <button
              onClick={nextTrack}
              className="text-xs text-white/40 hover:text-white/60 transition-colors p-2"
              aria-label="다음 트랙"
            >
              ⏭
            </button>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center px-6 relative z-10">
        <LadderSession
          theme={theme}
          entryMode={entryMode}
          profileContext={profileContext}
          onCrisis={setCrisis}
          onThemeChange={handleThemeChange}
        />
      </main>

      {/* Footer — 세션 중에는 숨김 (선택지와 겹침 방지) */}
      <footer className="text-center text-xs text-white/15 py-2 relative z-0 pointer-events-none select-none">
        <span className="opacity-0">풀림</span>
      </footer>
    </div>
  );
}
