"use client";

import { DebateRound } from "@/lib/types-v2";
import { EXPERT_STYLE } from "./ExpertCard";
import { ExpertName } from "@/lib/types-v2";

interface Props {
  round1: DebateRound[];
  round2: DebateRound | null;
  synthesis: string;
  isLoading?: boolean;
}

export default function DebateView({ round1, round2, synthesis, isLoading = false }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-6">
          <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-violet-50 text-violet-700">
            <span className="w-5 h-5 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
            <span className="text-sm font-medium">전문가 토론 진행 중...</span>
          </div>
        </div>
        {/* Skeleton */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 animate-pulse">
          <div className="space-y-3">
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-3 w-full bg-gray-100 rounded" />
            <div className="h-3 w-4/5 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (round1.length === 0) return null;

  const getExpertStyle = (name: string) => {
    return EXPERT_STYLE[name as ExpertName] || {
      emoji: "💬",
      color: "text-gray-700",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
    };
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-600 px-1">
        전문가 토론
      </h3>

      {/* Round 1: Rebuttals */}
      <div className="space-y-3">
        <p className="text-xs text-gray-400 px-1 uppercase tracking-wider">Round 1 — 다른 관점</p>
        {round1.map((round) => {
          const style = getExpertStyle(round.expert_name);
          return (
            <div
              key={round.expert_name}
              className={`rounded-2xl border ${style.borderColor} ${style.bgColor} p-4`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{style.emoji}</span>
                <span className={`text-sm font-semibold ${style.color}`}>
                  {round.expert_name}
                </span>
                <span className="text-xs text-gray-400">반론</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {round.content}
              </p>
            </div>
          );
        })}
      </div>

      {/* Round 2: Response */}
      {round2 && (
        <div className="space-y-3">
          <p className="text-xs text-gray-400 px-1 uppercase tracking-wider">Round 2 — 최종 응답</p>
          {(() => {
            const style = getExpertStyle(round2.expert_name);
            return (
              <div className={`rounded-2xl border-2 ${style.borderColor} ${style.bgColor} p-4`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{style.emoji}</span>
                  <span className={`text-sm font-semibold ${style.color}`}>
                    {round2.expert_name}
                  </span>
                  <span className="text-xs text-violet-500 font-medium">선택한 전문가</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {round2.content}
                </p>
              </div>
            );
          })()}
        </div>
      )}

      {/* Synthesis */}
      {synthesis && (
        <div className="rounded-2xl bg-violet-50 border border-violet-200 p-5">
          <h4 className="text-sm font-semibold text-violet-800 mb-2">토론 종합</h4>
          <p className="text-sm text-violet-700 leading-relaxed whitespace-pre-wrap">
            {synthesis}
          </p>
        </div>
      )}
    </div>
  );
}
