"use client";

import { CrystalAnalysis, Disagreement, CRYSTALS } from "@/lib/types-ultimate";

interface Props {
  analyses: CrystalAnalysis[];
  disagreements: Disagreement[];
  primaryColor: string;
  crystalLabel: string;
  useExpertLabels?: boolean;
}

export default function CrystalAnalysisView({ analyses, disagreements, primaryColor, crystalLabel, useExpertLabels = false }: Props) {
  return (
    <div className="flex flex-col gap-4 w-full max-w-md mx-auto">
      {/* 각 구슬 분석 결과 — RPG 패널 */}
      {analyses.map((analysis) => {
        const crystal = CRYSTALS.find((c) => c.name === analysis.crystal);
        if (!crystal) return null;

        return (
          <div
            key={analysis.crystal}
            className="rpg-panel-light px-4 py-3"
            style={{ animation: "sage-appear 0.4s ease-out" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{crystal.icon}</span>
              <span className="text-xs font-rpg text-white/60">
                {useExpertLabels ? `${crystal.expertLabel} 분석:` : `${crystal.name}의 ${crystalLabel}이 보여주는 것:`}
              </span>
            </div>
            <div className="text-sm text-white/75 leading-relaxed space-y-1.5">
              <p>{analysis.observation}</p>
              {analysis.insight && (
                <p className="text-white/65 text-xs italic">{analysis.insight}</p>
              )}
              {analysis.risk && <p className="text-[11px] text-amber-400/70 mt-1.5 font-rpg-sm">⚠ {analysis.risk}</p>}
              {analysis.question && <p className="text-[11px] text-white/55 mt-1 italic">&ldquo;{analysis.question}&rdquo;</p>}
            </div>
          </div>
        );
      })}

      {/* 불일치 — 강조 RPG 패널 */}
      {disagreements.length > 0 && (
        <div
          className="rpg-panel px-4 py-3 mt-2"
          style={{
            borderColor: `${primaryColor}40`,
            boxShadow: `inset 0 0 20px rgba(0,0,0,0.15), 0 0 15px ${primaryColor}10`,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">⚡</span>
            <span className="text-xs font-rpg" style={{ color: primaryColor }}>
              엇갈리는 지점
            </span>
          </div>
          {disagreements.map((d, i) => (
            <div key={i} className="text-sm text-white/70 leading-relaxed mb-2 last:mb-0">
              <p>{d.userImplication}</p>
              {d.positions.map((p, j) => {
                const crystal = CRYSTALS.find((c) => c.name === p.crystal);
                return (
                  <p key={j} className="text-xs text-white/55 mt-1 pl-2 font-rpg-sm">
                    {crystal?.icon} {p.stance}
                  </p>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
