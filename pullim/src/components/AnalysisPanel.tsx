"use client";

import { ExpertAnalysis } from "@/lib/types-v2";
import ExpertCard from "./ExpertCard";

interface Props {
  analyses: ExpertAnalysis[];
  isLoading?: boolean;
}

export default function AnalysisPanel({ analyses, isLoading = false }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-6">
          <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-violet-50 text-violet-700">
            <span className="w-5 h-5 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
            <span className="text-sm font-medium">3명의 전문가가 분석 중...</span>
          </div>
        </div>
        {/* Skeleton cards */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-gray-100 bg-white p-5 animate-pulse">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-gray-200" />
              <div className="h-4 w-24 bg-gray-200 rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full bg-gray-100 rounded" />
              <div className="h-3 w-4/5 bg-gray-100 rounded" />
              <div className="h-3 w-3/5 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (analyses.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-600 px-1">
        전문가 분석 결과
      </h3>
      {analyses.map((analysis) => (
        <ExpertCard
          key={analysis.expert_name}
          expertName={analysis.expert_name}
          analysis={analysis.analysis}
          question={analysis.question}
        />
      ))}
    </div>
  );
}
