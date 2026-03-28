"use client";

import { useState } from "react";
import { CrystalName, CRYSTALS } from "@/lib/types-ultimate";

interface Props {
  max: number;
  crystalLabel: string;
  crystalShape: "orb" | "lens" | "bud" | "star";
  primaryColor: string;
  onConfirm: (selected: CrystalName[]) => void;
  recommended?: CrystalName[];
  disabled?: boolean;
  useExpertLabels?: boolean; // 전략실: 전문가 이름으로 표시
}

export default function CrystalSelector({
  max,
  crystalLabel,
  crystalShape,
  primaryColor,
  onConfirm,
  recommended = [],
  disabled = false,
  useExpertLabels = false,
}: Props) {
  const [selected, setSelected] = useState<CrystalName[]>([]);
  const [showAll, setShowAll] = useState(false);

  const visibleCrystals = showAll ? CRYSTALS : CRYSTALS.slice(0, 6);

  const toggle = (name: CrystalName) => {
    if (disabled) return;
    if (selected.includes(name)) {
      setSelected(selected.filter((s) => s !== name));
    } else if (selected.length < max) {
      setSelected([...selected, name]);
    }
  };

  return (
    <div className="w-full max-w-md md:max-w-xl lg:max-w-2xl mx-auto">
      {/* 구슬 그리드 */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 justify-items-center">
        {visibleCrystals.map((crystal) => {
          const isSelected = selected.includes(crystal.name);
          const isRecommended = recommended.includes(crystal.name);
          const isFull = selected.length >= max && !isSelected;

          return (
            <button
              key={crystal.name}
              onClick={() => toggle(crystal.name)}
              disabled={disabled || isFull}
              className="flex flex-col items-center gap-2 group"
            >
              {/* 구슬/렌즈/봉오리 */}
              <div
                className={`
                  w-[56px] h-[56px] sm:w-[72px] sm:h-[72px] flex items-center justify-center text-[24px] sm:text-[28px]
                  transition-all duration-300
                  ${crystalShape === "orb" ? "rounded-full" : ""}
                  ${crystalShape === "lens" ? "rounded-xl" : ""}
                  ${crystalShape === "bud" ? "rounded-[50%_50%_50%_50%/60%_60%_40%_40%]" : ""}
                  ${isSelected
                    ? "scale-110 border-2"
                    : "border border-white/10 hover:border-white/25 hover:scale-105"
                  }
                  ${isFull && !isSelected ? "opacity-30" : ""}
                  ${disabled ? "pointer-events-none" : ""}
                `}
                style={{
                  borderColor: isSelected ? primaryColor : "transparent",
                  boxShadow: isSelected
                    ? `0 0 20px ${primaryColor}40, 0 0 50px ${primaryColor}15, inset 0 0 15px ${primaryColor}10`
                    : "none",
                  backgroundColor: isSelected ? "transparent" : "rgba(255,255,255,0.05)",
                  backgroundImage: isSelected
                    ? `radial-gradient(circle at 30% 30%, ${primaryColor}25, ${primaryColor}08, transparent)`
                    : "none",
                  animationName: isSelected ? "crystal-glow-intense, crystal-select-burst" : "crystal-float",
                  animationDuration: isSelected ? "2s, 0.3s" : "3s",
                  animationTimingFunction: "ease-in-out",
                  animationIterationCount: isSelected ? "infinite, 1" : "infinite",
                  animationDelay: `${(visibleCrystals.indexOf(crystal) * 0.3) % 2}s`,
                }}
              >
                {crystal.icon}
              </div>

              {/* 라벨 */}
              <div className="text-center">
                <p className={`text-xs font-rpg-sm ${isSelected ? "text-white/90" : "text-white/60"}`}>
                  {useExpertLabels ? crystal.expertLabel : crystal.name}
                </p>
                <p className={`text-[10px] sm:text-[11px] mt-0.5 max-w-[80px] sm:max-w-[90px] leading-tight ${isSelected ? "text-white/60" : "text-white/50"}`}>
                  {useExpertLabels ? crystal.expertDescription : crystal.description}
                </p>
                {isRecommended && !isSelected && (
                  <p className="text-[11px] mt-0.5 font-rpg-sm" style={{ color: primaryColor }}>
                    추천
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* 더 보기 */}
      {!showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-4 w-full text-xs text-white/55 hover:text-white/70 transition-colors font-rpg-sm"
        >
          + 더 많은 {crystalLabel} 보기
        </button>
      )}

      {/* 선택 확인 바 — RPG 패널 */}
      <div className="mt-6 rpg-panel flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40 font-rpg-sm">선택:</span>
          <div className="flex gap-1">
            {selected.map((name) => {
              const crystal = CRYSTALS.find((c) => c.name === name);
              return (
                <span key={name} className="text-lg">{crystal?.icon}</span>
              );
            })}
            {Array.from({ length: max - selected.length }).map((_, i) => (
              <span
                key={`empty-${i}`}
                className="w-5 h-5 rounded-full border border-white/10"
              />
            ))}
          </div>
          <span className="text-xs text-white/45 font-rpg-sm">({selected.length}/{max})</span>
        </div>

        <button
          onClick={() => onConfirm(selected)}
          disabled={selected.length !== max || disabled}
          className="rpg-button px-4 py-1.5 text-sm"
        >
          확인
        </button>
      </div>
    </div>
  );
}
