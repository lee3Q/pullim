"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Theme } from "@/lib/themes";

interface Props {
  theme: Theme;
}

function CampfireParticles({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

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
  }, [containerRef]);

  return null;
}

function FireflyParticles({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const particles: HTMLDivElement[] = [];
    for (let i = 0; i < 18; i++) {
      const p = document.createElement("div");
      const size = 2 + Math.random() * 3;
      const isGreen = Math.random() > 0.5;
      const color = isGreen
        ? `rgba(134, 239, 172, ${0.5 + Math.random() * 0.3})`
        : `rgba(196, 181, 253, ${0.5 + Math.random() * 0.3})`;
      p.style.cssText = `
        position: absolute;
        bottom: ${10 + Math.random() * 70}%;
        left: ${5 + Math.random() * 90}%;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: ${color};
        box-shadow: 0 0 ${size * 2}px ${color};
        opacity: 0;
        animation: firefly-float ${4 + Math.random() * 4}s ease-in-out infinite;
        animation-delay: ${Math.random() * 6}s;
        pointer-events: none;
      `;
      container.appendChild(p);
      particles.push(p);
    }

    return () => {
      particles.forEach((p) => p.remove());
    };
  }, [containerRef]);

  return null;
}

export default function ThemedBackground({ theme }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  if (theme.name === "모험가") {
    return (
      <div ref={containerRef} className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a2e] via-[#1e2a45] to-[#2a1f1a]" />
        <div className="absolute inset-0 opacity-40">
          <Image
            src={theme.assets.bg}
            alt=""
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        </div>
        <div
          className="absolute bottom-[15%] left-1/2 -translate-x-1/2 w-[600px] h-[300px]"
          style={{
            background: "radial-gradient(ellipse, rgba(255,160,50,0.08), rgba(255,120,40,0.04), transparent 70%)",
            animation: "campfire-breathe 5s ease-in-out infinite",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
        <CampfireParticles containerRef={containerRef} />
      </div>
    );
  }

  if (theme.name === "전략실") {
    return (
      <div ref={containerRef} className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a]" />
        <div className="absolute inset-0 opacity-40">
          <Image
            src={theme.assets.bg}
            alt=""
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        </div>
        {/* 파란 빛 ambient */}
        <div
          className="absolute bottom-[20%] left-1/2 -translate-x-1/2 w-[500px] h-[250px]"
          style={{
            background: "radial-gradient(ellipse, rgba(96,165,250,0.06), rgba(59,130,246,0.03), transparent 70%)",
            animation: "campfire-breathe 6s ease-in-out infinite",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
      </div>
    );
  }

  // 달빛정원
  return (
    <div ref={containerRef} className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f1729] via-[#1a2744] to-[#0f1729]" />
      <div className="absolute inset-0 opacity-40">
        <Image
          src={theme.assets.bg}
          alt=""
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
      <FireflyParticles containerRef={containerRef} />
    </div>
  );
}
