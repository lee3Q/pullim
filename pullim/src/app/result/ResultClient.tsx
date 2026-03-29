"use client";

import { useRouter } from "next/navigation";
import { getPersonalityTypeById } from "@/lib/personalization/personality-type";
import { createEmptyProfile } from "@/lib/personalization/probability-profile";
import type { ThemeType } from "@/lib/personalization/story-scenes";
import PersonalityResult from "@/components/discovery/PersonalityResult";

const THEME_COLORS: Record<ThemeType, string> = {
  garden: "#a78bfa",
  adventure: "#ff9f1c",
  strategy: "#60a5fa",
  stargazer: "#4338ca",
  apocalypse: "#f97316",
};

// 유형 ID → 대표 프로필 생성 (공유 페이지용)
function buildRepresentativeProfile(typeId: string) {
  const TYPES = [
    "quiet-strategist", "empathic-deliberator", "analytical-explorer", "bold-designer",
    "free-healer", "warm-guardian", "intuitive-breaker", "sensory-adventurer",
  ];
  const idx = TYPES.indexOf(typeId);
  const bits = idx >= 0 ? idx : 0;

  const profile = createEmptyProfile();
  profile.approachStyle = { value: bits & 4 ? 0.6 : -0.6, observations: 5, lastUpdated: new Date().toISOString() };
  profile.riskTolerance = { value: bits & 2 ? 0.6 : -0.6, observations: 5, lastUpdated: new Date().toISOString() };
  profile.copingStyle = { value: bits & 1 ? 0.6 : -0.6, observations: 5, lastUpdated: new Date().toISOString() };
  profile.decisionSpeed = { value: (bits & 4 ? 0.3 : -0.3), observations: 3, lastUpdated: new Date().toISOString() };
  return profile;
}

export default function ResultClient({ theme, typeId }: { theme: ThemeType; typeId: string }) {
  const router = useRouter();
  const type = getPersonalityTypeById(typeId);

  if (!type) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 bg-gradient-to-b from-[#12101a] via-[#1a1530] to-[#1e1a28]">
        <div className="text-center space-y-4">
          <p className="text-lg font-rpg-lg" style={{ color: "var(--fantasy-gold-bright)" }}>
            유형을 찾을 수 없어요
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 rounded-2xl text-sm font-rpg transition-all active:scale-[0.98]"
            style={{
              background: "linear-gradient(145deg, var(--fantasy-leather), var(--fantasy-leather-deep))",
              border: "1px solid var(--fantasy-gold-dark)",
              color: "var(--fantasy-button-text)",
              boxShadow: "0 2px 0 var(--fantasy-leather-darkest), 0 3px 8px rgba(0,0,0,0.8)",
            }}
          >
            나도 해보기
          </button>
        </div>
      </div>
    );
  }

  const profile = buildRepresentativeProfile(typeId);
  const primaryColor = THEME_COLORS[theme];

  return (
    <div className="min-h-[100dvh] flex flex-col items-center px-6 py-8 bg-gradient-to-b from-[#12101a] via-[#1a1530] to-[#1e1a28]">
      <PersonalityResult
        type={type}
        profile={profile}
        theme={theme}
        primaryColor={primaryColor}
        onContinue={() => router.push("/")}
      />
    </div>
  );
}
