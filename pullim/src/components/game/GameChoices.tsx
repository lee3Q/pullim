"use client";

import { useState } from "react";
import { type GameUIStyle } from "@/lib/themes";
import SelectionButtons from "@/components/ultimate/SelectionButtons";

interface Props {
  options: string[];
  onSelect: (option: string) => void;
  primaryColor: string;
  disabled?: boolean;
  onCustomInput?: () => void;
  visible: boolean;
  gameUI?: GameUIStyle;
}

export default function GameChoices({
  options,
  onSelect,
  primaryColor,
  disabled = false,
  onCustomInput,
  visible,
  gameUI,
}: Props) {
  // Use options key to auto-reset selected state
  const optionsKey = options.join("|");
  const [selectedState, setSelectedState] = useState<{ key: string; value: string | null }>({ key: optionsKey, value: null });
  const selected = selectedState.key === optionsKey ? selectedState.value : null;
  const setSelected = (v: string | null) => setSelectedState({ key: optionsKey, value: v });

  // Fallback: no gameUI -> use original SelectionButtons
  if (!gameUI) {
    return (
      <SelectionButtons
        options={options}
        onSelect={onSelect}
        primaryColor={primaryColor}
        disabled={disabled}
        onCustomInput={onCustomInput}
      />
    );
  }

  if (!visible) return null;

  const handleSelect = (option: string) => {
    if (disabled || selected) return;
    setSelected(option);
    onSelect(option);
  };

  const isCard = gameUI?.choiceStyle === "card";
  const isSignpost = gameUI?.choiceStyle === "signpost";
  const btnClass = isCard ? "game-card-button" : isSignpost ? "game-signpost-button" : "game-petal-button";

  return (
    <div className="flex flex-col gap-2.5 max-w-md mx-auto w-full">
      {options.map((option, i) => {
        const isSelected = selected === option;
        const isFaded = selected !== null && !isSelected;

        return (
          <button
            key={i}
            onClick={() => handleSelect(option)}
            disabled={disabled || (selected !== null && !isSelected)}
            className={`${btnClass} w-full text-left px-3 py-2.5 sm:px-5 sm:py-3.5 text-sm font-rpg transition-all duration-300`}
            style={{
              opacity: isFaded ? 0.25 : 1,
              animationDelay: `${0.3 + i * 0.1}s`,
              borderColor: isSelected ? `${primaryColor}80` : undefined,
              boxShadow: isSelected
                ? `0 0 16px ${primaryColor}30`
                : undefined,
              ...(!isCard && isSignpost && !isSelected && !isFaded
                ? { transform: `rotate(${i % 2 === 0 ? -0.8 : 0.8}deg)` }
                : {}),
            }}
          >
            {option}
          </button>
        );
      })}
      {onCustomInput && !selected && (
        <button
          onClick={onCustomInput}
          disabled={disabled}
          className={`${btnClass} w-full text-left px-3 py-2.5 sm:px-5 sm:py-3.5 text-sm font-rpg transition-all duration-300 text-white/35`}
          style={{ animationDelay: `${0.3 + options.length * 0.1}s` }}
        >
          {isCard ? "직접 입력" : isSignpost ? "직접 말하기" : "직접 입력하기"}
        </button>
      )}
    </div>
  );
}
