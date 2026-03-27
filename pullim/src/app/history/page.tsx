"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

export default function HistoryPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* 배경 — 홈과 동일 */}
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
      <header className="px-4 py-3 flex items-center gap-3 relative z-10">
        <button
          onClick={() => router.back()}
          className="rpg-button-ghost px-3 py-1.5 text-xs font-rpg-sm"
        >
          &larr; 뒤로
        </button>
        <span className="text-sm font-rpg text-white/70">내 기록</span>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        <div className="rpg-panel px-8 py-10 max-w-sm md:max-w-lg lg:max-w-xl w-full text-center">
          <p className="text-white/65 text-sm font-rpg mb-6">
            아직 기록이 없습니다.
          </p>
          <button
            onClick={() => router.push("/")}
            className="rpg-button px-6 py-2.5 text-sm font-rpg"
          >
            새 고민 시작하기
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-white/25 py-4 relative z-10">
        풀림은 전문 상담을 대체하지 않습니다.
      </footer>
    </div>
  );
}
