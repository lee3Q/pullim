"use client";

import Link from "next/link";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        .error-icon { animation: float 3s ease-in-out infinite; }
        .error-glow { animation: glow-pulse 2s ease-in-out infinite; }
      `}</style>
      <div
        className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center"
        style={{ background: "#12101a" }}
      >
        {/* 배경 글로우 */}
        <div
          className="error-glow absolute w-48 h-48 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)",
          }}
        />

        <div className="error-icon text-5xl mb-6 select-none">🌙</div>

        <h1 className="font-rpg-lg text-lg mb-3" style={{ color: "#C0A788" }}>
          길을 잃은 것 같네요
        </h1>

        <p className="font-rpg text-sm leading-relaxed mb-8" style={{ color: "rgba(192,167,136,0.55)" }}>
          어두운 숲 어딘가에서 길을 잃었나 봐요.
          <br />
          다시 돌아가볼까요?
        </p>

        <div className="flex flex-col gap-3 w-full max-w-[240px]">
          <button
            onClick={reset}
            className="rpg-button-ghost font-rpg text-sm py-3 px-6 rounded-xl transition-opacity"
            style={{
              border: "1px solid rgba(167,139,250,0.4)",
              color: "rgba(167,139,250,0.8)",
              background: "rgba(167,139,250,0.08)",
            }}
          >
            다시 시도하기
          </button>

          <Link
            href="/"
            className="font-rpg text-sm py-3 px-6 rounded-xl text-center transition-opacity hover:opacity-70"
            style={{
              border: "1px solid rgba(192,163,116,0.3)",
              color: "rgba(192,167,136,0.6)",
            }}
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </>
  );
}
