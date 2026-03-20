"use client";

import { useState } from "react";

interface Props {
  options: string[];
  onSelect: (option: string) => void;
  primaryColor: string;
  disabled?: boolean;
  onCustomInput?: () => void;
}

export default function SelectionButtons({ options, onSelect, primaryColor, disabled = false, onCustomInput }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (option: string) => {
    if (disabled || selected) return;
    setSelected(option);
    onSelect(option);
  };

  return (
    <div
      className="flex flex-col gap-2 max-w-md mx-auto w-full"
      style={{ animation: "sage-appear 0.4s ease-out" }}
    >
      {options.map((option, i) => {
        const isSelected = selected === option;
        const isFaded = selected !== null && !isSelected;

        return (
          <button
            key={i}
            onClick={() => handleSelect(option)}
            disabled={disabled || (selected !== null && !isSelected)}
            className={`w-full text-left px-4 py-3 text-sm font-rpg transition-all duration-300 ${
              isSelected
                ? "rpg-button"
                : "rpg-button-ghost"
            }`}
            style={{
              opacity: isFaded ? 0.3 : 1,
              borderColor: isSelected ? `${primaryColor}80` : undefined,
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
          className="w-full text-left px-4 py-3 text-sm font-rpg transition-all duration-300 rpg-button-ghost text-white/40"
        >
          직접 입력하기
        </button>
      )}
    </div>
  );
}
