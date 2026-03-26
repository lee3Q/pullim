"use client";

interface SessionSummaryProps {
  summary: string;
  onClose: () => void;
  onBackToHome: () => void;
}

export default function SessionSummary({
  summary,
  onClose,
  onBackToHome,
}: SessionSummaryProps) {
  return (
    <div className="w-full max-w-sm mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 space-y-4">
        <h3 className="text-sm font-medium text-white/60">오늘의 정리</h3>
        <p className="text-sm text-white/80 leading-relaxed whitespace-pre-line">
          {summary}
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl text-sm text-white/40 hover:text-white/60 border border-white/10 hover:border-white/20 transition-all"
        >
          계속 이야기하기
        </button>
        <button
          onClick={onBackToHome}
          className="w-full py-3 text-center text-xs text-white/25 hover:text-white/40 transition-colors"
        >
          오늘은 여기까지
        </button>
      </div>
    </div>
  );
}
