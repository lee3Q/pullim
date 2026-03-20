"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

export default function CampfireBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 불꽃 파티클 — 작고 은은하게
    const particles: HTMLDivElement[] = [];
    for (let i = 0; i < 12; i++) {
      const p = document.createElement("div");
      const size = 1.5 + Math.random() * 3;
      p.style.cssText = `
        position: absolute;
        bottom: 25%;
        left: ${44 + Math.random() * 12}%;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255,180,80,0.8), rgba(255,140,50,0.4), transparent);
        opacity: 0;
        animation: campfire-float ${2.5 + Math.random() * 2}s ease-out infinite;
        animation-delay: ${Math.random() * 4}s;
        pointer-events: none;
      `;
      container.appendChild(p);
      particles.push(p);
    }

    return () => {
      particles.forEach((p) => p.remove());
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 -z-10 overflow-hidden">
      {/* 배경: 더 따뜻하고 밝은 톤 — 짙은 파란색 제거 */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a2e] via-[#1e2a45] to-[#2a1f1a]" />

      {/* 배경 이미지 — opacity 올려서 잘 보이게 */}
      <div className="absolute inset-0 opacity-40">
        <Image
          src="/assets/campfire-bg.webp"
          alt=""
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      </div>

      {/* 모닥불 따뜻한 빛 — 은은하게 (큰 둥근 원 제거, 부드러운 ambient로) */}
      <div
        className="absolute bottom-[15%] left-1/2 -translate-x-1/2 w-[600px] h-[300px]"
        style={{
          background: "radial-gradient(ellipse, rgba(255,160,50,0.08), rgba(255,120,40,0.04), transparent 70%)",
          animation: "campfire-breathe 5s ease-in-out infinite",
        }}
      />

      {/* 상단 어둡게 — 자연스러운 비네팅 */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
    </div>
  );
}
