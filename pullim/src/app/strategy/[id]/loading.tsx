export default function StrategyLoading() {
  return (
    <>
      <style>{`
        @keyframes str-bar-1 {
          0%, 100% { height: 8px; opacity: 0.4; }
          25%       { height: 28px; opacity: 0.9; }
        }
        @keyframes str-bar-2 {
          0%, 100% { height: 16px; opacity: 0.5; }
          50%       { height: 36px; opacity: 1; }
        }
        @keyframes str-bar-3 {
          0%, 100% { height: 12px; opacity: 0.4; }
          75%       { height: 24px; opacity: 0.8; }
        }
        @keyframes str-scan {
          0%   { transform: translateY(-100%); opacity: 0; }
          20%  { opacity: 0.6; }
          80%  { opacity: 0.6; }
          100% { transform: translateY(100%); opacity: 0; }
        }
        @keyframes str-text {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 0.9; }
        }
        .str-bar-1 {
          width: 6px; border-radius: 3px;
          background: rgba(96,165,250,0.7);
          animation: str-bar-1 1.2s ease-in-out infinite;
        }
        .str-bar-2 {
          width: 6px; border-radius: 3px;
          background: rgba(96,165,250,0.9);
          animation: str-bar-2 1.2s ease-in-out infinite;
          animation-delay: 0.2s;
        }
        .str-bar-3 {
          width: 6px; border-radius: 3px;
          background: rgba(96,165,250,0.7);
          animation: str-bar-3 1.2s ease-in-out infinite;
          animation-delay: 0.4s;
        }
        .str-scan-line {
          position: absolute; inset-x-0;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(96,165,250,0.6), transparent);
          animation: str-scan 2s linear infinite;
        }
        .str-text { animation: str-text 1.8s ease-in-out infinite; }
      `}</style>
      <div
        className="min-h-[100dvh] flex flex-col items-center justify-center gap-8"
        style={{ background: "#12101a" }}
      >
        {/* 데이터 바 시각화 */}
        <div className="relative flex items-end gap-2" style={{ height: "44px" }}>
          <div className="str-scan-line" />
          <div className="str-bar-1" />
          <div className="str-bar-2" />
          <div className="str-bar-3" />
        </div>

        <div className="flex flex-col items-center gap-1">
          <p className="str-text font-rpg text-sm" style={{ color: "rgba(96,165,250,0.75)" }}>
            데이터를 분석하는 중...
          </p>
          <p className="font-rpg text-xs" style={{ color: "rgba(96,165,250,0.35)" }}>
            잠시 대기해주십시오
          </p>
        </div>
      </div>
    </>
  );
}
