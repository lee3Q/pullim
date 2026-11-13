export default function AdventureLoading() {
  return (
    <>
      <style>{`
        @keyframes adv-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes adv-pulse {
          0%, 100% { opacity: 0.25; transform: scale(0.95); }
          50%       { opacity: 0.7;  transform: scale(1.05); }
        }
        @keyframes adv-text {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 1; }
        }
        .adv-ring {
          width: 48px; height: 48px; border-radius: 50%;
          border: 2px solid transparent;
          border-top-color: rgba(255,159,28,0.8);
          border-right-color: rgba(255,159,28,0.3);
          animation: adv-spin 1.2s linear infinite;
        }
        .adv-core {
          position: absolute;
          width: 20px; height: 20px; border-radius: 50%;
          background: radial-gradient(circle, rgba(255,159,28,0.6) 0%, transparent 70%);
          animation: adv-pulse 1.5s ease-in-out infinite;
        }
        .adv-text { animation: adv-text 1.5s ease-in-out infinite; }
      `}</style>
      <div
        className="min-h-[100dvh] flex flex-col items-center justify-center gap-8"
        style={{ background: "#12101a" }}
      >
        <div className="relative flex items-center justify-center">
          <div className="adv-ring" />
          <div className="adv-core" />
        </div>

        <div className="flex flex-col items-center gap-1">
          <p className="adv-text font-rpg text-sm" style={{ color: "rgba(255,159,28,0.75)" }}>
            수정구슬이 빛을 모으는 중...
          </p>
          <p className="font-rpg text-xs" style={{ color: "rgba(255,159,28,0.35)" }}>
            모험가여, 잠시만 기다려주게
          </p>
        </div>
      </div>
    </>
  );
}
