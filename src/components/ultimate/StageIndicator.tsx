"use client";

import { StageName, DisplayStage, STAGE_TO_DISPLAY } from "@/lib/types-ultimate";

const DISPLAY_STAGES: DisplayStage[] = ["입장", "듣기", "리서치", "구슬", "결론"];

interface Props {
  currentStage: StageName;
  primaryColor: string;
}

export default function StageIndicator({ currentStage, primaryColor }: Props) {
  const currentDisplay = STAGE_TO_DISPLAY[currentStage];
  const currentIndex = DISPLAY_STAGES.indexOf(currentDisplay);
  const isComplete = currentStage === "COMPLETE";

  return (
    <div className="flex items-center gap-1 overflow-x-auto px-4 py-3 scrollbar-hide">
      {DISPLAY_STAGES.map((stage, i) => {
        const isCurrent = stage === currentDisplay && !isComplete;
        const isCompleted = isComplete || currentIndex > i;

        return (
          <div key={stage} className="flex items-center">
            {i > 0 && (
              <div
                className="h-px w-4 mx-1"
                style={{ background: isCompleted ? primaryColor : "rgba(255,255,255,0.1)" }}
              />
            )}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-rpg-sm whitespace-nowrap transition-all"
              style={{
                background: isCurrent
                  ? `${primaryColor}20`
                  : isCompleted
                  ? `${primaryColor}10`
                  : "rgba(255,255,255,0.03)",
                color: isCurrent || isCompleted
                  ? primaryColor
                  : "rgba(255,255,255,0.3)",
                outlineColor: isCurrent ? `${primaryColor}50` : undefined,
                outline: isCurrent ? `2px solid ${primaryColor}50` : undefined,
              }}
            >
              {isCompleted ? (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : isCurrent ? (
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: primaryColor }}
                />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
              )}
              {stage}
            </div>
          </div>
        );
      })}
    </div>
  );
}
