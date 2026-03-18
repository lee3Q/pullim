"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/lib/store/session-store";
import { useHydration } from "@/lib/store/use-hydration";
import CrisisAlert from "@/components/CrisisAlert";

const EXAMPLE_CONCERNS = [
  "이직을 해야 할까, 지금 회사에 남아야 할까",
  "전공을 바꾸고 싶은데 너무 늦은 건 아닌지",
  "관계를 정리해야 할지 한 번 더 노력해볼지",
  "돈을 모아야 할까, 자기계발에 투자해야 할까",
];

export default function HomePage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [crisis, setCrisis] = useState<{ message: string; hotline: string } | null>(null);

  const hydrated = useHydration();
  const createSession = useSessionStore((s) => s.createSession);
  const setRouting = useSessionStore((s) => s.setRouting);
  const sessionCount = useSessionStore((s) => s.getSessionCount);

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    // Free tier check
    if (sessionCount() >= 3) {
      alert("무료 사용 한도(월 3회)를 초과했습니다. 프리미엄을 시작해보세요.");
      return;
    }

    setIsLoading(true);

    try {
      // Route the concern
      const res = await fetch("/api/route-concern", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: trimmed }),
      });

      const data = await res.json();

      // Crisis check
      if (data.crisis) {
        setCrisis({ message: data.message, hotline: data.hotline });
        setIsLoading(false);
        return;
      }

      // Create session and set routing
      const sessionId = createSession(trimmed);
      setRouting(sessionId, data.model, data.scores, data.explanation);

      // Navigate to session
      router.push(`/session/${sessionId}`);
    } catch (error) {
      console.error("Error:", error);
      alert("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white flex flex-col">
      {crisis && (
        <CrisisAlert
          message={crisis.message}
          hotline={crisis.hotline}
          onClose={() => setCrisis(null)}
        />
      )}

      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center">
        <span className="text-lg font-bold text-violet-700">풀림</span>
        <button
          onClick={() => router.push("/history")}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          내 기록
        </button>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            어떤 고민이 있나요?
          </h1>
          <p className="text-gray-500 text-sm">
            함께 정리하다 보면, 답이 보이기 시작해요
          </p>
        </div>

        {/* Input */}
        <div className="w-full max-w-xl">
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="고민을 자유롭게 적어주세요..."
              rows={3}
              className="w-full rounded-2xl border border-gray-200 px-5 py-4 text-base
                         shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-300
                         focus:border-transparent resize-none
                         placeholder:text-gray-400"
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              className="absolute bottom-3 right-3 px-4 py-2 rounded-xl
                         bg-violet-600 text-white text-sm font-medium
                         hover:bg-violet-700 active:bg-violet-800
                         disabled:bg-gray-200 disabled:text-gray-400
                         transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  분석 중
                </span>
              ) : (
                "시작하기"
              )}
            </button>
          </div>

          {/* Examples */}
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            {EXAMPLE_CONCERNS.map((concern) => (
              <button
                key={concern}
                onClick={() => setInput(concern)}
                className="text-xs text-gray-500 bg-white border border-gray-200
                           rounded-full px-3 py-1.5 hover:border-violet-300
                           hover:text-violet-600 transition-colors"
              >
                {concern}
              </button>
            ))}
          </div>
        </div>

        {/* Session count */}
        <p className="mt-8 text-xs text-gray-400">
          이번 달 {hydrated ? sessionCount() : 0}/3회 사용
        </p>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 py-4">
        풀림은 전문 상담을 대체하지 않습니다. 위기 시{" "}
        <a href="tel:1393" className="text-violet-500 underline">
          1393
        </a>
        으로 연락하세요.
      </footer>
    </div>
  );
}
