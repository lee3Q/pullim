"use client";

import { useRouter } from "next/navigation";
import { useSessionStore } from "@/lib/store/session-store";
import { MODEL_LABELS, ModelType } from "@/lib/types";

export default function HistoryPage() {
  const router = useRouter();
  const sessions = useSessionStore((s) => s.sessions);

  const sessionList = Object.values(sessions)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.push("/")} className="text-violet-600 text-sm font-medium">
          &larr; 홈
        </button>
        <span className="text-sm font-semibold text-gray-900">내 기록</span>
        <div className="w-12" />
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {sessionList.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 mb-4">아직 기록이 없어요</p>
            <button
              onClick={() => router.push("/")}
              className="text-violet-600 text-sm font-medium"
            >
              첫 고민 시작하기
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sessionList.map((session) => (
              <button
                key={session.id}
                onClick={() => router.push(`/session/${session.id}`)}
                className="w-full text-left bg-white border border-gray-100 rounded-xl p-4 shadow-sm
                           hover:border-violet-200 transition-colors"
              >
                <p className="text-sm text-gray-800 font-medium line-clamp-2 mb-2">
                  {session.input_text}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>
                    {new Date(session.created_at).toLocaleDateString("ko-KR", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {session.model_type && (
                    <span className="bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full">
                      {MODEL_LABELS[session.model_type as ModelType]}
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded-full ${
                      session.current_stage === "COMPLETE"
                        ? "bg-green-50 text-green-600"
                        : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {session.current_stage === "COMPLETE" ? "완료" : "진행중"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
