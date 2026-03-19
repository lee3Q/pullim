"use client";

import { V2StageName } from "@/lib/types-v2";

const V2_STAGE_ORDER: (V2StageName | "ROUTING" | "COMPLETE")[] = [
  "LISTEN",
  "EXPERT_SELECT",
  "ANALYZE",
  "DEBATE",
  "LAND",
];

const V2_STAGE_LABELS: Record<V2StageName, string> = {
  LISTEN: "듣기",
  EXPERT_SELECT: "전문가 선택",
  ANALYZE: "분석",
  DEBATE: "토론",
  LAND: "정리",
};

interface Props {
  currentStage: V2StageName | "ROUTING" | "COMPLETE";
}

export default function V2StageIndicator({ currentStage }: Props) {
  const currentIndex = V2_STAGE_ORDER.indexOf(currentStage as V2StageName);
  const isComplete = currentStage === "COMPLETE";
  const isRouting = currentStage === "ROUTING";

  return (
    <div className="flex items-center gap-1 overflow-x-auto px-4 py-3 scrollbar-hide">
      {V2_STAGE_ORDER.map((name, i) => {
        const label = V2_STAGE_LABELS[name as V2StageName];
        if (!label) return null;

        const isCurrentStage = currentStage === name;
        const isCompleted = isComplete || (!isRouting && currentIndex > i);

        return (
          <div key={name} className="flex items-center">
            {i > 0 && (
              <div
                className={`h-px w-4 mx-1 ${
                  isCompleted ? "bg-violet-400" : "bg-gray-200"
                }`}
              />
            )}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                isCurrentStage
                  ? "bg-violet-100 text-violet-700 ring-2 ring-violet-300"
                  : isCompleted
                  ? "bg-violet-50 text-violet-500"
                  : "bg-gray-50 text-gray-400"
              }`}
            >
              {isCompleted ? (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : isCurrentStage ? (
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
              )}
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { V2_STAGE_LABELS };
