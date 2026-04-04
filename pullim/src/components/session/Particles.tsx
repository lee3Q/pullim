"use client";

import { useMemo } from "react";

interface ParticlesProps {
  theme: "모험가" | "전략실" | "달빛정원" | "천문대" | "종말";
}

interface ParticleConfig {
  count: number;
  className: string;
  style: (i: number) => React.CSSProperties;
}

function getParticleConfig(theme: string): ParticleConfig {
  switch (theme) {
    case "모험가":
      // 반딧불: 작은 노란 원, 랜덤 float + glow
      return {
        count: 20,
        className: "particle-firefly",
        style: (i) => ({
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          width: `${2 + Math.random() * 3}px`,
          height: `${2 + Math.random() * 3}px`,
          animationDelay: `${Math.random() * 8}s`,
          animationDuration: `${4 + Math.random() * 6}s`,
        }),
      };
    case "전략실":
      // 안개: 큰 흰색 원, 느린 drift, 매우 낮은 opacity
      return {
        count: 8,
        className: "particle-fog",
        style: (i) => ({
          left: `${Math.random() * 120 - 10}%`,
          top: `${Math.random() * 100}%`,
          width: `${80 + Math.random() * 120}px`,
          height: `${80 + Math.random() * 120}px`,
          animationDelay: `${Math.random() * 10}s`,
          animationDuration: `${12 + Math.random() * 8}s`,
        }),
      };
    case "달빛정원":
      // 꽃잎: 작은 분홍 타원, 회전하며 낙하
      return {
        count: 18,
        className: "particle-petal",
        style: (i) => ({
          left: `${Math.random() * 100}%`,
          top: `${-10 - Math.random() * 20}%`,
          width: `${4 + Math.random() * 4}px`,
          height: `${6 + Math.random() * 6}px`,
          animationDelay: `${Math.random() * 10}s`,
          animationDuration: `${8 + Math.random() * 7}s`,
        }),
      };
    case "천문대":
      // 별똥별: 작은 흰 점, 대각선 이동 + trail
      return {
        count: 15,
        className: "particle-star",
        style: (i) => ({
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 60}%`,
          width: `${1.5 + Math.random() * 2}px`,
          height: `${1.5 + Math.random() * 2}px`,
          animationDelay: `${Math.random() * 12}s`,
          animationDuration: `${2 + Math.random() * 3}s`,
        }),
      };
    case "종말":
      // 재/먼지: 작은 회색 원, 느린 상승
      return {
        count: 22,
        className: "particle-ash",
        style: (i) => ({
          left: `${Math.random() * 100}%`,
          bottom: `${-5 - Math.random() * 10}%`,
          width: `${2 + Math.random() * 3}px`,
          height: `${2 + Math.random() * 3}px`,
          animationDelay: `${Math.random() * 10}s`,
          animationDuration: `${6 + Math.random() * 8}s`,
        }),
      };
    default:
      return {
        count: 15,
        className: "particle-firefly",
        style: (i) => ({
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          width: "3px",
          height: "3px",
          animationDelay: `${Math.random() * 8}s`,
          animationDuration: `${5 + Math.random() * 5}s`,
        }),
      };
  }
}

export default function Particles({ theme }: ParticlesProps) {
  const config = useMemo(() => getParticleConfig(theme), [theme]);

  const particles = useMemo(() => {
    return Array.from({ length: config.count }, (_, i) => ({
      key: `${theme}-${i}`,
      style: config.style(i),
    }));
  }, [config, theme]);

  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 1 }}
      aria-hidden="true"
    >
      {particles.map((p) => (
        <div
          key={p.key}
          className={`absolute ${config.className}`}
          style={p.style}
        />
      ))}
    </div>
  );
}
