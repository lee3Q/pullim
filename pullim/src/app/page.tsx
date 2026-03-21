"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { nanoid } from "nanoid";
import { ThemeName } from "@/lib/types-ultimate";
import { THEMES } from "@/lib/themes";
import ThemeSelector from "@/components/ultimate/ThemeSelector";
import CrisisAlert from "@/components/CrisisAlert";

const FLOW_STEPS = [
  { icon: "📜", label: "고민 꺼내기" },
  { icon: "🔮", label: "3개 관점 탐색" },
  { icon: "✨", label: "나만의 결론" },
] as const;

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"game" | "chat">("game");
  const [crisis, setCrisis] = useState<{ message: string; hotline: string } | null>(null);

  const handleThemeSelect = (theme: ThemeName) => {
    setIsLoading(true);
    const sessionId = nanoid(12);
    const route = THEMES[theme].route;
    router.push(`${route}/${sessionId}?theme=${theme}&mode=${mode}`);
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

      {/* 배경 — 세 갈래 길 */}
      <div className="fixed inset-0 -z-10 overflow-hidden" style={{ height: "100dvh" }}>
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
        {/* 타이틀 + 설명 */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-white/90 mb-3 leading-relaxed font-rpg">
            당신의 마음을 풀어줄 세계
          </h1>
          <p className="text-white/50 text-sm leading-relaxed">
            고민을 꺼내면, 3개 관점이 함께 들여다보고
          </p>
          <p className="text-white/50 text-sm">
            스스로 답을 찾아가는 여정입니다.
          </p>
        </div>

        {/* 진행 흐름 3단계 */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {FLOW_STEPS.map((step, i) => (
            <div key={step.label} className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg">{step.icon}</span>
                <span className="text-[11px] text-white/45 font-rpg-sm">{step.label}</span>
              </div>
              {i < FLOW_STEPS.length - 1 && (
                <span className="text-white/20 text-[10px] mt-[-14px]">▸</span>
              )}
            </div>
          ))}
        </div>

        {/* 테마 선택 안내 */}
        <p className="text-white/35 text-xs mb-5 font-rpg-sm">
          어디로 가시겠습니까?
        </p>

        {/* 모드 선택: 게임형(기본) / 대화형 */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <button
            onClick={() => setMode("game")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-rpg transition-all ${
              mode === "game"
                ? "bg-white/10 text-white/90 border border-white/20"
                : "text-white/30 hover:text-white/50"
            }`}
          >
            🎮 게임처럼 진행
          </button>
          <button
            onClick={() => setMode("chat")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-rpg transition-all ${
              mode === "chat"
                ? "bg-white/10 text-white/90 border border-white/20"
                : "text-white/30 hover:text-white/50"
            }`}
          >
            💬 대화로 진행
          </button>
        </div>

        <ThemeSelector onSelect={handleThemeSelect} disabled={isLoading} />

        {/* 첫 방문자 추천 */}
        <p className="mt-6 text-[11px] text-white/25 text-center">
          뭘 골라야 할지 모르겠다면?{" "}
          <button
            onClick={() => handleThemeSelect("달빛정원")}
            disabled={isLoading}
            className="text-purple-300/40 hover:text-purple-300/60 transition-colors underline underline-offset-2"
          >
            달빛정원
          </button>
          이 가장 편해요.
        </p>

        <div className="mt-6" />
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
