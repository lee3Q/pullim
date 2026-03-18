"use client";

import { useParams, useRouter } from "next/navigation";
import { useSessionStore } from "@/lib/store/session-store";
import DecisionRecord from "@/components/DecisionRecord";

export default function DecisionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const session = useSessionStore((s) => s.sessions[sessionId]);

  if (!session || !session.decision_record) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <p className="text-gray-500 mb-4">정리 문서를 찾을 수 없습니다.</p>
        <button
          onClick={() => router.push("/")}
          className="text-violet-600 text-sm font-medium"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => router.push(`/session/${sessionId}`)}
          className="text-violet-600 text-sm font-medium"
        >
          &larr; 대화로 돌아가기
        </button>
        <span className="text-sm font-semibold text-gray-900">풀림</span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert("링크가 복사되었습니다!");
          }}
          className="text-violet-600 text-sm font-medium"
        >
          공유
        </button>
      </header>
      <DecisionRecord record={session.decision_record} />
    </div>
  );
}
