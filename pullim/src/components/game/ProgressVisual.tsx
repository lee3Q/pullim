"use client";

import { StageName, DisplayStage, STAGE_TO_DISPLAY } from "@/lib/types-ultimate";
import { type GameUIStyle } from "@/lib/themes";
import StageIndicator from "@/components/ultimate/StageIndicator";

const DISPLAY_STAGES: DisplayStage[] = ["입장", "듣기", "리서치", "구슬", "결론"];

const GARDEN_ICONS: Record<DisplayStage, { emoji: string; label: string }> = {
  입장: { emoji: "\uD83C\uDF31", label: "씨앗" },
  듣기: { emoji: "\uD83C\uDF3F", label: "새싹" },
  리서치: { emoji: "\uD83C\uDF43", label: "잎" },
  구슬: { emoji: "\uD83C\uDF3A", label: "봉오리" },
  결론: { emoji: "\uD83C\uDF38", label: "꽃" },
};

const JOURNEY_ICONS: Record<DisplayStage, { emoji: string; label: string }> = {
  입장: { emoji: "\uD83C\uDFD8\uFE0F", label: "마을" },
  듣기: { emoji: "\uD83C\uDF32", label: "숲" },
  리서치: { emoji: "\u26F0\uFE0F", label: "산" },
  구슬: { emoji: "\uD83D\uDD2E", label: "동굴" },
  결론: { emoji: "\uD83C\uDFD4\uFE0F", label: "정상" },
};

const ANALYSIS_ICONS: Record<DisplayStage, { emoji: string; label: string }> = {
  입장: { emoji: "\uD83D\uDCCB", label: "접수" },
  듣기: { emoji: "\uD83D\uDD0D", label: "분석" },
  리서치: { emoji: "\uD83D\uDCCA", label: "리서치" },
  구슬: { emoji: "\u2696\uFE0F", label: "검토" },
  결론: { emoji: "\u2705", label: "결론" },
};

interface Props {
  currentStage: StageName;
  primaryColor: string;
  gameUI?: GameUIStyle;
}

export default function ProgressVisual({ currentStage, primaryColor, gameUI }: Props) {
  if (!gameUI || (gameUI.progressStyle !== "garden" && gameUI.progressStyle !== "journey" && gameUI.progressStyle !== "analysis")) {
    return <StageIndicator currentStage={currentStage} primaryColor={primaryColor} />;
  }

  const icons = gameUI.progressStyle === "analysis" ? ANALYSIS_ICONS : gameUI.progressStyle === "journey" ? JOURNEY_ICONS : GARDEN_ICONS;
  const currentDisplay = STAGE_TO_DISPLAY[currentStage];
  const currentIndex = DISPLAY_STAGES.indexOf(currentDisplay);
  const isComplete = currentStage === "COMPLETE";

  return (
    <div className="flex items-center gap-1 overflow-x-auto px-4 py-3 scrollbar-hide">
      {DISPLAY_STAGES.map((stage, i) => {
        const isCurrent = stage === currentDisplay && !isComplete;
        const isCompleted = isComplete || currentIndex > i;
        const icon = icons[stage];

        return (
          <div key={stage} className="flex items-center">
            {i > 0 && (
              <div
                className="h-px w-4 mx-1 transition-colors duration-500"
                style={{ background: isCompleted ? primaryColor : "rgba(255,255,255,0.1)" }}
              />
            )}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-rpg-sm whitespace-nowrap transition-all duration-500"
              style={{
                background: isCurrent
                  ? `${primaryColor}20`
                  : isCompleted
                  ? `${primaryColor}10`
                  : "rgba(255,255,255,0.03)",
                color: isCurrent || isCompleted
                  ? primaryColor
                  : "rgba(255,255,255,0.3)",
                outline: isCurrent ? `2px solid ${primaryColor}50` : undefined,
              }}
            >
              <span
                className="text-sm transition-all duration-500"
                style={{
                  filter: isCurrent
                    ? `drop-shadow(0 0 4px ${primaryColor})`
                    : isCompleted
                    ? "none"
                    : "grayscale(1) opacity(0.4)",
                  opacity: isCurrent || isCompleted ? 1 : 0.4,
                }}
              >
                {icon.emoji}
              </span>
              {icon.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
