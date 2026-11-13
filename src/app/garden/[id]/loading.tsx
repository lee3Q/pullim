export default function GardenLoading() {
  return (
    <>
      <style>{`
        @keyframes gdn-float {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.5; }
          50%       { transform: translateY(-6px) scale(1.08); opacity: 0.9; }
        }
        @keyframes gdn-petal-1 {
          0%, 100% { transform: rotate(0deg) translateX(16px); opacity: 0.6; }
          50%       { transform: rotate(180deg) translateX(16px); opacity: 0.3; }
        }
        @keyframes gdn-petal-2 {
          0%, 100% { transform: rotate(120deg) translateX(16px); opacity: 0.4; }
          50%       { transform: rotate(300deg) translateX(16px); opacity: 0.7; }
        }
        @keyframes gdn-petal-3 {
          0%, 100% { transform: rotate(240deg) translateX(16px); opacity: 0.5; }
          50%       { transform: rotate(60deg) translateX(16px); opacity: 0.3; }
        }
        @keyframes gdn-text {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 0.9; }
        }
        .gdn-moon {
          width: 20px; height: 20px; border-radius: 50%;
          background: radial-gradient(circle, rgba(167,139,250,0.7) 0%, transparent 70%);
          box-shadow: 0 0 16px rgba(167,139,250,0.4);
          animation: gdn-float 2s ease-in-out infinite;
        }
        .gdn-p1 { position: absolute; font-size: 9px; animation: gdn-petal-1 3s ease-in-out infinite; color: rgba(167,139,250,0.7); }
        .gdn-p2 { position: absolute; font-size: 9px; animation: gdn-petal-2 3s ease-in-out infinite; color: rgba(167,139,250,0.5); }
        .gdn-p3 { position: absolute; font-size: 9px; animation: gdn-petal-3 3s ease-in-out infinite; color: rgba(167,139,250,0.6); }
        .gdn-text { animation: gdn-text 2s ease-in-out infinite; }
      `}</style>
      <div
        className="min-h-[100dvh] flex flex-col items-center justify-center gap-8"
        style={{ background: "#12101a" }}
      >
        <div className="relative w-12 h-12 flex items-center justify-center">
          <div className="gdn-moon" />
          <span className="gdn-p1">✿</span>
          <span className="gdn-p2">✿</span>
          <span className="gdn-p3">✿</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <p className="gdn-text font-rpg text-sm" style={{ color: "rgba(167,139,250,0.75)" }}>
            달빛이 내려앉는 중...
          </p>
          <p className="font-rpg text-xs" style={{ color: "rgba(167,139,250,0.35)" }}>
            잠깐만 기다려줘
          </p>
        </div>
      </div>
    </>
  );
}
