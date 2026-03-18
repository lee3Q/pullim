"use client";

import { StageName, STAGE_ORDER, STAGE_LABELS, StageStatus } from "@/lib/types";

interface Props {
  currentStage: StageName | "ROUTING" | "COMPLETE";
  stages: { name: StageName; status: StageStatus }[];
}

export default function StageIndicator({ currentStage, stages }: Props) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto px-4 py-3 scrollbar-hide">
      {STAGE_ORDER.map((name, i) => {
        const stage = stages.find((s) => s.name === name);
        const status = stage?.status || "pending";
        const isCurrent = currentStage === name;

        return (
          <div key={name} className="flex items-center">
            {i > 0 && (
              <div
                className={`h-px w-4 mx-1 ${
                  status === "completed"
                    ? "bg-violet-400"
                    : "bg-gray-200"
                }`}
              />
            )}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                isCurrent
                  ? "bg-violet-100 text-violet-700 ring-2 ring-violet-300"
                  : status === "completed"
                  ? "bg-violet-50 text-violet-500"
                  : "bg-gray-50 text-gray-400"
              }`}
            >
              {status === "completed" ? (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : isCurrent ? (
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
              )}
              {STAGE_LABELS[name]}
            </div>
          </div>
        );
      })}
    </div>
  );
}
