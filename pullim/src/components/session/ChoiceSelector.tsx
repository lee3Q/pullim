"use client";

interface ChoiceSelectorProps {
  options: string[];
  recommendedIndex: number;
  onSelect: (option: string, index: number) => void;
  primaryColor: string;
  disabled?: boolean;
}

/**
 * 추천 표시가 포함된 선택지 컴포넌트
 * 모든 선택지에 추천 뱃지가 하나 붙는다.
 */
export default function ChoiceSelector({
  options,
  recommendedIndex,
  onSelect,
  primaryColor,
  disabled = false,
}: ChoiceSelectorProps) {
  if (options.length === 0) return null;

  return (
    <div className="space-y-2">
      {options.map((option, i) => {
        const isRecommended = i === recommendedIndex;
        const isFreeInput = option === "직접 쓰기" || option === "직접 말하기";

        return (
          <button
            key={i}
            onClick={() => !disabled && onSelect(option, i)}
            disabled={disabled}
            className="w-full py-3 px-4 rounded-xl text-sm text-left transition-all border flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            style={{
              background: isRecommended ? `${primaryColor}15` : "rgba(255,255,255,0.05)",
              borderColor: isRecommended ? `${primaryColor}60` : "rgba(255,255,255,0.15)",
              color: "white",
              animationDelay: `${i * 60}ms`,
            }}
          >
            <span className="flex-1">{option}</span>
            {isRecommended && !isFreeInput && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-full shrink-0"
                style={{ background: `${primaryColor}30`, color: primaryColor }}
              >
                추천
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
