import Link from "next/link";

const STARS: [number, number, number, number, number][] = [
  [8, 20, 2, 2.1, 0.0],
  [12, 65, 1.5, 3.3, 0.5],
  [22, 80, 2, 2.7, 1.0],
  [38, 10, 1, 4.1, 0.3],
  [55, 88, 2.5, 2.5, 0.8],
  [68, 30, 1.5, 3.7, 1.5],
  [78, 55, 1, 2.9, 0.2],
  [28, 45, 2, 3.5, 1.2],
  [50, 72, 1.5, 2.3, 0.7],
  [88, 15, 2, 4.5, 0.4],
  [15, 42, 1, 3.1, 1.8],
  [42, 22, 2.5, 2.8, 0.6],
  [72, 78, 1.5, 3.9, 1.1],
  [18, 92, 1, 2.6, 0.9],
  [62, 48, 2, 4.2, 0.1],
  [5, 50, 1, 3.6, 0.7],
  [92, 60, 1.5, 2.4, 1.3],
  [33, 5, 2, 3.0, 0.4],
];

export default function NotFound() {
  return (
    <>
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.1; transform: scale(0.6); }
          50% { opacity: 0.85; transform: scale(1.4); }
        }
        @keyframes float-in {
          from { opacity: 0; transform: translateY(28px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes mist-drift {
          0%, 100% { opacity: 0.22; transform: translateX(-12px) scaleX(1); }
          50% { opacity: 0.5; transform: translateX(12px) scaleX(1.05); }
        }
        @keyframes glow-pulse {
          0%, 100% { text-shadow: 0 0 20px rgba(192,163,116,0.2); }
          50% { text-shadow: 0 0 50px rgba(192,163,116,0.45), 0 0 80px rgba(138,110,200,0.15); }
        }
        .nf-star {
          position: absolute;
          border-radius: 50%;
          background: #f1e1c5;
          animation: twinkle var(--d) ease-in-out infinite;
          animation-delay: var(--dl);
        }
        .nf-content {
          animation: float-in 1.3s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .nf-mist {
          animation: mist-drift var(--md) ease-in-out infinite;
          animation-delay: var(--mdl);
        }
        .nf-404 {
          animation: glow-pulse 4s ease-in-out infinite;
        }
        .nf-link:hover {
          background: rgba(192,163,116,0.12) !important;
          border-color: rgba(192,163,116,0.6) !important;
        }
      `}</style>

      <main
        style={{
          minHeight: "100dvh",
          background: "#12101a",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          padding: "0 24px",
        }}
      >
        {/* 별 */}
        {STARS.map(([top, left, size, dur, delay], i) => (
          <span
            key={i}
            className="nf-star"
            style={
              {
                top: `${top}%`,
                left: `${left}%`,
                width: `${size}px`,
                height: `${size}px`,
                "--d": `${dur}s`,
                "--dl": `${delay}s`,
              } as React.CSSProperties
            }
          />
        ))}

        {/* 안개 레이어 */}
        <div
          className="nf-mist"
          style={
            {
              position: "absolute",
              bottom: "12%",
              left: "-15%",
              width: "130%",
              height: "140px",
              background:
                "radial-gradient(ellipse at center, rgba(138,110,200,0.1) 0%, transparent 70%)",
              "--md": "10s",
              "--mdl": "0s",
            } as React.CSSProperties
          }
        />
        <div
          className="nf-mist"
          style={
            {
              position: "absolute",
              bottom: "0%",
              left: "-5%",
              width: "110%",
              height: "80px",
              background:
                "radial-gradient(ellipse at center, rgba(192,163,116,0.07) 0%, transparent 65%)",
              "--md": "14s",
              "--mdl": "4s",
            } as React.CSSProperties
          }
        />

        {/* 본문 */}
        <div
          className="nf-content font-rpg"
          style={{
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
            maxWidth: "340px",
            width: "100%",
          }}
        >
          {/* 장식 심볼 */}
          <div
            style={{
              fontSize: "18px",
              letterSpacing: "0.5em",
              color: "var(--fantasy-gold)",
              opacity: 0.5,
            }}
          >
            ✦ ✦ ✦
          </div>

          {/* 404 */}
          <div
            className="nf-404"
            style={{
              fontSize: "80px",
              fontWeight: 700,
              color: "var(--fantasy-gold-bright)",
              lineHeight: 1,
              letterSpacing: "0.06em",
            }}
          >
            404
          </div>

          {/* 주 메시지 */}
          <h1
            style={{
              fontSize: "21px",
              fontWeight: 400,
              color: "var(--fantasy-text)",
              lineHeight: 1.65,
              margin: 0,
            }}
          >
            이 길은 아직 열리지 않았어요
          </h1>

          {/* 부 메시지 */}
          <p
            style={{
              fontSize: "13px",
              color: "rgba(192,167,136,0.5)",
              lineHeight: 1.9,
              margin: 0,
            }}
          >
            찾으시는 장소는 지도에 없거나,
            <br />
            다른 길로 이어졌을 수 있어요.
          </p>

          {/* 구분선 */}
          <div
            style={{
              width: "72px",
              height: "1px",
              background:
                "linear-gradient(to right, transparent, var(--fantasy-gold), transparent)",
              opacity: 0.35,
            }}
          />

          {/* 홈 링크 */}
          <Link
            href="/"
            className="nf-link"
            style={{
              display: "inline-block",
              padding: "13px 32px",
              border: "1px solid rgba(192,163,116,0.28)",
              borderRadius: "3px",
              color: "var(--fantasy-gold-bright)",
              fontSize: "14px",
              textDecoration: "none",
              background: "rgba(192,163,116,0.05)",
              letterSpacing: "0.1em",
              transition: "background 0.2s ease, border-color 0.2s ease",
            }}
          >
            처음으로 돌아가기
          </Link>
        </div>
      </main>
    </>
  );
}
