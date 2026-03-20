"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { nanoid } from "nanoid";
import { ThemeName } from "@/lib/types-ultimate";
import { THEMES } from "@/lib/themes";
import ThemeSelector from "@/components/ultimate/ThemeSelector";
import CrisisAlert from "@/components/CrisisAlert";

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [crisis, setCrisis] = useState<{ message: string; hotline: string } | null>(null);

  const handleThemeSelect = (theme: ThemeName) => {
    setIsLoading(true);
    const sessionId = nanoid(12);
    const route = THEMES[theme].route;
    router.push(`${route}/${sessionId}?theme=${theme}`);
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {crisis && (
        <CrisisAlert
          message={crisis.message}
          hotline={crisis.hotline}
          onClose={() => setCrisis(null)}
        />
      )}

      {/* 배경 — 세 갈래 길 */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
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
        <span className="text-lg font-bold text-white/80 font-rpg">풀림</span>
        <button
          onClick={() => router.push("/history")}
          className="text-sm text-white/40 hover:text-white/60 transition-colors font-rpg-sm"
        >
          내 기록
        </button>
      </header>

      {/* Demo 안내 */}
      <div className="mx-6 mt-2 rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm px-4 py-3 relative z-10">
        <p className="text-xs text-white/60 text-center leading-relaxed">
          현재 <span className="text-white/80 font-medium">체험판</span>입니다. 예시 답변이 제공됩니다.<br />
          실제 AI 분석은 정식 테스트에서 경험하실 수 있습니다.
        </p>
      </div>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20 relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-xl font-bold text-white/90 mb-3 leading-relaxed font-rpg">
            당신의 마음을 풀어줄 세계
          </h1>
          <p className="text-white/50 text-sm mb-1">
            풀림에 오신 것을 환영합니다.
          </p>
          <p className="text-white/40 text-xs mb-1">
            AI 3개 관점이 당신의 고민을 함께 들여다봅니다.
          </p>
          <p className="text-white/35 text-xs">
            어디로 가시겠습니까?
          </p>
        </div>

        <ThemeSelector onSelect={handleThemeSelect} disabled={isLoading} />

        <div className="mt-10" />
      </main>

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
