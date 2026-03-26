export default function Loading() {
  return (
    <>
      <style>{`
        @keyframes orbit {
          from { transform: rotate(0deg) translateX(18px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(18px) rotate(-360deg); }
        }
        @keyframes pulse-dim {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.9; }
        }
        @keyframes text-blink {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.85; }
        }
        .star-1 { animation: orbit 2.4s linear infinite; }
        .star-2 { animation: orbit 2.4s linear infinite; animation-delay: -0.8s; }
        .star-3 { animation: orbit 2.4s linear infinite; animation-delay: -1.6s; }
        .core-glow { animation: pulse-dim 1.8s ease-in-out infinite; }
        .loading-text { animation: text-blink 1.8s ease-in-out infinite; }
      `}</style>
      <div
        className="min-h-[100dvh] flex flex-col items-center justify-center gap-8"
        style={{ background: "#12101a" }}
      >
        {/* 오브 애니메이션 */}
        <div className="relative w-12 h-12 flex items-center justify-center">
          <div
            className="core-glow w-4 h-4 rounded-full"
            style={{ background: "rgba(192,163,116,0.6)", boxShadow: "0 0 12px rgba(192,163,116,0.4)" }}
          />
          <div className="star-1 absolute text-[8px] select-none" style={{ color: "rgba(192,163,116,0.8)" }}>✦</div>
          <div className="star-2 absolute text-[8px] select-none" style={{ color: "rgba(192,163,116,0.6)" }}>✦</div>
          <div className="star-3 absolute text-[8px] select-none" style={{ color: "rgba(192,163,116,0.5)" }}>✦</div>
        </div>

        <p className="loading-text font-rpg text-sm" style={{ color: "rgba(192,167,136,0.6)" }}>
          별빛을 불러오는 중...
        </p>
      </div>
    </>
  );
}
